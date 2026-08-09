export type Priority = 'low' | 'medium' | 'high';
export type SyncStatus = 'synced' | 'pending' | 'error';

/** Shape used everywhere in the app (UI, local DB, Supabase). */
export interface Task {
  id: string;              // local UUID, generated on-device
  remoteId?: string | null; // Supabase row id, once synced
  userId: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;  // ISO string
  priority: Priority;
  isCompleted: boolean;
  isDeleted: boolean;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  email?: string | null;
  fullName?: string | null;
}
