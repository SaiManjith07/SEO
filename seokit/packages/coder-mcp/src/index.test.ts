import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { saveMemory, loadMemory, closeDb } from './tools/memoryOps.js';
import { listFiles, readFile } from './tools/fileOps.js';

describe('coder-mcp memory and files tools tests', () => {
  const testDir = path.join(process.cwd(), '.seokit_test_temp');

  beforeAll(() => {
    // Create temporary folder for test files
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    fs.writeFileSync(path.join(testDir, 'test1.txt'), 'Hello world', 'utf-8');
    fs.writeFileSync(path.join(testDir, 'test2.log'), 'Ignored file content', 'utf-8');
  });

  afterAll(() => {
    // Reset in-memory path cache
    closeDb();

    // Cleanup temporary files
    if (fs.existsSync(path.join(testDir, 'test1.txt'))) {
      fs.unlinkSync(path.join(testDir, 'test1.txt'));
    }
    if (fs.existsSync(path.join(testDir, 'test2.log'))) {
      fs.unlinkSync(path.join(testDir, 'test2.log'));
    }
    if (fs.existsSync(testDir)) {
      fs.rmdirSync(testDir);
    }

    // Cleanup memory JSON store
    const memoryFile = path.join(process.cwd(), '.seokit', 'coder-memory.json');
    if (fs.existsSync(memoryFile)) {
      fs.unlinkSync(memoryFile);
    }
    const dbDir = path.join(process.cwd(), '.seokit');
    if (fs.existsSync(dbDir)) {
      try {
        fs.rmdirSync(dbDir);
      } catch {
        // may be busy or already empty
      }
    }
  });

  it('should successfully save and load project memory database entries', () => {
    const projectId = 'test-proj';
    const key = 'build-conventions';
    const value = 'Always compile using tsc';
    const metadata = 'Init test run';

    const insertId = saveMemory(projectId, key, value, metadata);
    expect(insertId).toBeDefined();

    const fetched = loadMemory(projectId, key);
    expect(fetched.length).toBe(1);
    expect(fetched[0].project_id).toBe(projectId);
    expect(fetched[0].key).toBe(key);
    expect(fetched[0].value).toBe(value);
    expect(fetched[0].metadata).toBe(metadata);

    const allProjMem = loadMemory(projectId);
    expect(allProjMem.length).toBe(1);
  });

  it('should list files recursively and apply exclusion filter correctly', async () => {
    const files = await listFiles(testDir, ['log']);
    expect(files).toContain('test1.txt');
    expect(files).not.toContain('test2.log');
  });

  it('should read file size and contents correctly', async () => {
    const filePath = path.join(testDir, 'test1.txt');
    const result = await readFile(filePath);
    expect(result.content).toBe('Hello world');
    expect(result.size).toBe(11);
    expect(result.mtime).toBeDefined();
  });
});
