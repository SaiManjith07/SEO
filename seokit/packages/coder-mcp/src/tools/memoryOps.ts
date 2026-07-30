import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

let dbInstance: Database.Database | null = null;

export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

function getDb(): Database.Database {
  if (dbInstance) return dbInstance;

  const dbDir = path.join(process.cwd(), '.seokit');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, 'coder-memory.db');
  const db = new Database(dbPath);

  // Initialize schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS project_memory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      metadata TEXT,
      updated_at TEXT NOT NULL,
      UNIQUE(project_id, key)
    );
  `);

  dbInstance = db;
  return db;
}

export interface MemoryEntry {
  id: number;
  project_id: string;
  key: string;
  value: string;
  metadata?: string;
  updated_at: string;
}

export function saveMemory(projectId: string, key: string, value: string, metadata?: string): string {
  const db = getDb();
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO project_memory (project_id, key, value, metadata, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(project_id, key) DO UPDATE SET
      value = excluded.value,
      metadata = excluded.metadata,
      updated_at = excluded.updated_at
  `);
  
  const result = stmt.run(projectId, key, value, metadata || null, now);
  return result.lastInsertRowid.toString();
}

export function loadMemory(projectId: string, key?: string): MemoryEntry[] {
  const db = getDb();
  
  if (key) {
    const stmt = db.prepare(`
      SELECT * FROM project_memory 
      WHERE project_id = ? AND key = ?
    `);
    return stmt.all(projectId, key) as MemoryEntry[];
  } else {
    const stmt = db.prepare(`
      SELECT * FROM project_memory 
      WHERE project_id = ?
      ORDER BY updated_at DESC
    `);
    return stmt.all(projectId) as MemoryEntry[];
  }
}
