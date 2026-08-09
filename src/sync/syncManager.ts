import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../config/supabaseClient';
import {
  getPendingSyncTasks,
  markSynced,
  markSyncError,
  purgeSyncedDeletes,
  upsertLocalTask,
} from '../db/taskLocalRepository';

/**
 * Pushes every locally-pending change (create/update/soft-delete) to Supabase.
 * Uses `client_id` + `user_id` as the natural key so an upsert on the server
 * either creates a brand-new row or updates the one already linked to it —
 * this is what makes offline-created tasks sync cleanly once they come online.
 */
export async function pushLocalChanges(): Promise<void> {
  const pending = await getPendingSyncTasks();

  for (const task of pending) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .upsert(
          {
            id: task.remoteId ?? undefined,
            client_id: task.id,
            user_id: task.userId,
            title: task.title,
            description: task.description,
            due_date: task.dueDate,
            priority: task.priority,
            is_completed: task.isCompleted,
            is_deleted: task.isDeleted,
          },
          { onConflict: 'user_id,client_id' },
        )
        .select('id')
        .single();

      if (error) throw error;
      await markSynced(task.id, data.id);
    } catch (err) {
      // Leave it as 'pending' → will retry next sync cycle. A repeated
      // hard failure (e.g. constraint violation) gets flagged as 'error'
      // so the UI can surface it instead of retrying forever.
      await markSyncError(task.id);
    }
  }

  await purgeSyncedDeletes();
}

/** Full pull — used on login and pull-to-refresh to catch up on remote state. */
export async function pullRemoteChanges(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('is_deleted', false);

  if (error) throw error;

  for (const row of data ?? []) {
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
  }
}

/** Runs both directions; call this on login and on reconnect. */
export async function fullSync(userId: string): Promise<void> {
  await pushLocalChanges();
  await pullRemoteChanges(userId);
}

/** Wire this up once (e.g. in App.tsx) to auto-sync whenever connectivity returns. */
export function watchConnectivityAndSync(userId: string): () => void {
  const unsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable !== false) {
      fullSync(userId).catch(() => {});
    }
  });
  return unsubscribe;
}
