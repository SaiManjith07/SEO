import * as fs from 'fs';
import * as path from 'path';

/**
 * Project memory storage — plain JSON file, no native/SQL database.
 * Mirrors the pattern already used by @seokit/core's memory/db.ts: one
 * JSON array on disk under `.seokit/`, read-modify-write per call. No
 * native module, no compiled binary, nothing that can fail to install
 * in a sandboxed or offline environment.
 */

export interface MemoryEntry {
  id: number;
  project_id: string;
  key: string;
  value: string;
  metadata?: string;
  updated_at: string;
}

let cachedPath: string | null = null;

function getMemoryFilePath(): string {
  if (cachedPath) return cachedPath;
  const dbDir = path.join(process.cwd(), '.seokit');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  cachedPath = path.join(dbDir, 'coder-memory.json');
  return cachedPath;
}

function readEntries(): MemoryEntry[] {
  const filePath = getMemoryFilePath();
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as MemoryEntry[];
  } catch {
    return [];
  }
}

function writeEntries(entries: MemoryEntry[]): void {
  fs.writeFileSync(getMemoryFilePath(), JSON.stringify(entries, null, 2), 'utf-8');
}

/** No-op kept for API compatibility — there is no file handle/connection to release. */
export function closeDb(): void {
  cachedPath = null;
}

export function saveMemory(
  projectId: string,
  key: string,
  value: string,
  metadata?: string
): string {
  const entries = readEntries();
  const now = new Date().toISOString();

  // Upsert on (project_id, key) — same uniqueness constraint the old
  // SQLite schema enforced with `UNIQUE(project_id, key)`.
  const existingIndex = entries.findIndex(
    (e) => e.project_id === projectId && e.key === key
  );

  if (existingIndex >= 0) {
    const updated: MemoryEntry = {
      ...entries[existingIndex],
      value,
      metadata,
      updated_at: now,
    };
    entries[existingIndex] = updated;
    writeEntries(entries);
    return updated.id.toString();
  }

  const nextId = entries.reduce((max, e) => Math.max(max, e.id), 0) + 1;
  const record: MemoryEntry = {
    id: nextId,
    project_id: projectId,
    key,
    value,
    metadata,
    updated_at: now,
  };
  entries.push(record);
  writeEntries(entries);
  return record.id.toString();
}

export function loadMemory(projectId: string, key?: string): MemoryEntry[] {
  const entries = readEntries();
  const filtered = key
    ? entries.filter((e) => e.project_id === projectId && e.key === key)
    : entries.filter((e) => e.project_id === projectId);
  return filtered.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}
