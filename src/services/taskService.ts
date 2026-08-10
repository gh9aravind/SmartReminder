import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../config/supabaseClient';
import {
  getAllLocalTasks,
  upsertLocalTask,
  softDeleteLocalTask,
} from '../db/taskLocalRepository';
import { pushLocalChanges } from '../sync/syncManager';
import type { Task, Priority } from '../types';

/**
 * Every write goes through this file:
 *   1. Save to SQLite immediately (UI reads only from local DB → instant, works offline)
 *   2. Fire-and-forget a sync attempt if a connection is available
 * The sync engine (syncManager) is the single source of truth for reconciling
 * with Supabase, so this file never talks to Postgres directly except to read.
 */

export async function listTasks(userId: string): Promise<Task[]> {
  return getAllLocalTasks(userId);
}

export async function createTask(
  userId: string,
  input: { title: string; description?: string; dueDate?: string; priority?: Priority },
): Promise<Task> {
  const now = new Date().toISOString();
  const task: Task = {
    id: uuidv4(),
    remoteId: null,
    userId,
    title: input.title,
    description: input.description ?? null,
    dueDate: input.dueDate ?? null,
    priority: input.priority ?? 'medium',
    isCompleted: false,
    isDeleted: false,
    syncStatus: 'pending',
    createdAt: now,
    updatedAt: now,
  };
  await upsertLocalTask(task);
  triggerSyncIfOnline();
  return task;
}

export async function updateTask(task: Task): Promise<void> {
  const updated: Task = { ...task, syncStatus: 'pending', updatedAt: new Date().toISOString() };
  await upsertLocalTask(updated);
  triggerSyncIfOnline();
}

export async function toggleTaskComplete(task: Task): Promise<void> {
  await updateTask({ ...task, isCompleted: !task.isCompleted });
}

export async function deleteTask(taskId: string): Promise<void> {
  await softDeleteLocalTask(taskId);
  triggerSyncIfOnline();
}

async function triggerSyncIfOnline() {
  const net = await NetInfo.fetch();
  if (net.isConnected && net.isInternetReachable !== false) {
    pushLocalChanges().catch(() => {
      // Sync errors are non-fatal here — syncManager marks the row 'error'
      // and a future connectivity change / manual retry will pick it up.
    });
  }
}

interface RemoteTaskRow {
  id: string;
  client_id: string | null;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: Priority;
  is_completed: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Subscribes to Postgres changes on `tasks` for the current user via
 * Supabase Realtime, merging remote inserts/updates into the local DB
 * so other devices' changes show up without a manual pull.
 */
export function subscribeToRemoteTaskChanges(userId: string, onChange: () => void) {
  const channel = supabase
    .channel(`tasks-changes-${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` },
      async (payload) => {
        const row = payload.new as RemoteTaskRow;
        if (!row) return;
        await upsertLocalTask({
          id: row.client_id ?? row.id,
          remoteId: row.id,
          userId: row.user_id,
          title: row.title,
          description: row.description,
          dueDate: row.due_date,
          priority: row.priority,
          isCompleted: row.is_completed,
          isDeleted: row.is_deleted,
          syncStatus: 'synced',
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        });
        onChange();
      },
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
