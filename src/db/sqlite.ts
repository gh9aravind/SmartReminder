import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

let dbInstance: SQLiteDatabase | null = null;

/** Returns a singleton connection to the on-device database. */
export async function getDBConnection(): Promise<SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabase({
    name: 'smart_reminder.db',
    location: 'default',
  });
  return dbInstance;
}

/**
 * Local mirror of the `tasks` table in Postgres, plus a `sync_status`
 * column that the sync engine uses to know what still needs pushing.
 */
export async function initSchema(): Promise<void> {
  const db = await getDBConnection();
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS tasks (
      id            TEXT PRIMARY KEY NOT NULL,
      remote_id     TEXT,
      user_id       TEXT NOT NULL,
      title         TEXT NOT NULL,
      description   TEXT,
      due_date      TEXT,
      priority      TEXT NOT NULL DEFAULT 'medium',
      is_completed  INTEGER NOT NULL DEFAULT 0,
      is_deleted    INTEGER NOT NULL DEFAULT 0,
      sync_status   TEXT NOT NULL DEFAULT 'pending',
      created_at    TEXT NOT NULL,
      updated_at    TEXT NOT NULL
    );
  `);
  await db.executeSql(`
    CREATE INDEX IF NOT EXISTS idx_tasks_sync_status ON tasks (sync_status);
  `);
}
