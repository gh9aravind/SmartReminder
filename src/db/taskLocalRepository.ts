import { getDBConnection } from './sqlite';
import { Task } from '../types';

interface TaskRow {
  id: string;
  remote_id: string | null;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string;
  is_completed: number;
  is_deleted: number;
  sync_status: string;
  created_at: string;
  updated_at: string;
}

/** Maps a raw SQLite row into the app-wide Task shape. */
function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    remoteId: row.remote_id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    priority: row.priority,
    isCompleted: !!row.is_completed,
    isDeleted: !!row.is_deleted,
    syncStatus: row.sync_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAllLocalTasks(userId: string): Promise<Task[]> {
  const db = await getDBConnection();
  const [result] = await db.executeSql(
    'SELECT * FROM tasks WHERE user_id = ? AND is_deleted = 0 ORDER BY due_date ASC',
    [userId],
  );
  const tasks: Task[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    tasks.push(rowToTask(result.rows.item(i)));
  }
  return tasks;
}

export async function getPendingSyncTasks(): Promise<Task[]> {
  const db = await getDBConnection();
  const [result] = await db.executeSql(
    "SELECT * FROM tasks WHERE sync_status != 'synced'",
  );
  const tasks: Task[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    tasks.push(rowToTask(result.rows.item(i)));
  }
  return tasks;
}

export async function upsertLocalTask(task: Task): Promise<void> {
  const db = await getDBConnection();
  await db.executeSql(
    `INSERT INTO tasks
       (id, remote_id, user_id, title, description, due_date, priority,
        is_completed, is_deleted, sync_status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       remote_id = excluded.remote_id,
       title = excluded.title,
       description = excluded.description,
       due_date = excluded.due_date,
       priority = excluded.priority,
       is_completed = excluded.is_completed,
       is_deleted = excluded.is_deleted,
       sync_status = excluded.sync_status,
       updated_at = excluded.updated_at;`,
    [
      task.id,
      task.remoteId ?? null,
      task.userId,
      task.title,
      task.description ?? null,
      task.dueDate ?? null,
      task.priority,
      task.isCompleted ? 1 : 0,
      task.isDeleted ? 1 : 0,
      task.syncStatus,
      task.createdAt,
      task.updatedAt,
    ],
  );
}

/** Soft-delete: keeps the row so the deletion can be synced later. */
export async function softDeleteLocalTask(id: string): Promise<void> {
  const db = await getDBConnection();
  await db.executeSql(
    "UPDATE tasks SET is_deleted = 1, sync_status = 'pending', updated_at = ? WHERE id = ?",
    [new Date().toISOString(), id],
  );
}

export async function markSynced(id: string, remoteId: string): Promise<void> {
  const db = await getDBConnection();
  await db.executeSql(
    "UPDATE tasks SET sync_status = 'synced', remote_id = ? WHERE id = ?",
    [remoteId, id],
  );
}

export async function markSyncError(id: string): Promise<void> {
  const db = await getDBConnection();
  await db.executeSql("UPDATE tasks SET sync_status = 'error' WHERE id = ?", [id]);
}

/** Permanently removes rows that were soft-deleted and already synced. */
export async function purgeSyncedDeletes(): Promise<void> {
  const db = await getDBConnection();
  await db.executeSql("DELETE FROM tasks WHERE is_deleted = 1 AND sync_status = 'synced'");
}
