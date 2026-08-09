-- =========================================================
-- Smart Reminder App — Supabase Schema
-- Run this in Supabase SQL Editor (or via `supabase db push`)
-- =========================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------
-- 1. PROFILES (extends auth.users)
-- ---------------------------------------------------------
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Profiles are updatable by owner"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------
-- 2. TASKS
-- ---------------------------------------------------------
create table public.tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text,                          -- maps to the local SQLite row id (for sync)
  title text not null,
  description text,
  due_date timestamptz,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  is_completed boolean not null default false,
  is_deleted boolean not null default false,  -- soft delete, so offline clients can sync the deletion
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_tasks_user_id on public.tasks(user_id);
create index idx_tasks_due_date on public.tasks(due_date);
create unique index idx_tasks_client_id on public.tasks(user_id, client_id);

alter table public.tasks enable row level security;

-- Users may only ever see/change their own rows
create policy "Select own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Insert own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Update own tasks"
  on public.tasks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Delete own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- Keep updated_at fresh on every UPDATE (used for last-write-wins sync)
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_tasks_updated_at
before update on public.tasks
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------
-- 3. REALTIME
-- ---------------------------------------------------------
alter publication supabase_realtime add table public.tasks;
