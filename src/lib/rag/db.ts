import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('opener_rag.db').then(async (db) => {
      await db.execAsync(`
        CREATE VIRTUAL TABLE IF NOT EXISTS file_chunks USING fts5(
          folder_root UNINDEXED,
          uri UNINDEXED,
          name UNINDEXED,
          chunk_index UNINDEXED,
          content
        );
        CREATE TABLE IF NOT EXISTS indexed_folders (
          folder_root TEXT PRIMARY KEY,
          indexed_at INTEGER NOT NULL,
          file_count INTEGER NOT NULL
        );
      `);
      return db;
    });
  }
  return dbPromise;
}

export async function clearFolderIndex(folderRoot: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM file_chunks WHERE folder_root = ?', folderRoot);
  await db.runAsync('DELETE FROM indexed_folders WHERE folder_root = ?', folderRoot);
}

export async function insertChunks(folderRoot: string, uri: string, name: string, chunks: string[]): Promise<void> {
  const db = await getDb();
  for (let i = 0; i < chunks.length; i++) {
    await db.runAsync(
      'INSERT INTO file_chunks (folder_root, uri, name, chunk_index, content) VALUES (?, ?, ?, ?, ?)',
      folderRoot,
      uri,
      name,
      i,
      chunks[i]
    );
  }
}

export async function setFolderIndexed(folderRoot: string, fileCount: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO indexed_folders (folder_root, indexed_at, file_count) VALUES (?, ?, ?)
     ON CONFLICT(folder_root) DO UPDATE SET indexed_at = excluded.indexed_at, file_count = excluded.file_count`,
    folderRoot,
    Date.now(),
    fileCount
  );
}

export interface FolderIndexStatus {
  indexedAt: number;
  fileCount: number;
}

export async function getFolderIndexStatus(folderRoot: string): Promise<FolderIndexStatus | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ indexed_at: number; file_count: number }>(
    'SELECT indexed_at, file_count FROM indexed_folders WHERE folder_root = ?',
    folderRoot
  );
  return row ? { indexedAt: row.indexed_at, fileCount: row.file_count } : null;
}

export interface ChunkMatch {
  uri: string;
  name: string;
  content: string;
}

export async function searchFolder(folderRoot: string, matchQuery: string, limit = 6): Promise<ChunkMatch[]> {
  const db = await getDb();
  return db.getAllAsync<ChunkMatch>(
    `SELECT uri, name, content FROM file_chunks
     WHERE folder_root = ? AND file_chunks MATCH ?
     ORDER BY rank LIMIT ?`,
    folderRoot,
    matchQuery,
    limit
  );
}
