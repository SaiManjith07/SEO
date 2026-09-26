import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { createFixtureAdapter } from './index.js';

describe('FixtureAdapter', () => {
  const fixtureRoot = path.join(__dirname, 'test-fixtures');
  const adapter = createFixtureAdapter(fixtureRoot);

  beforeEach(() => {
    if (fs.existsSync(fixtureRoot)) {
      fs.rmSync(fixtureRoot, { recursive: true, force: true });
    }
    fs.mkdirSync(path.join(fixtureRoot, 'crux'), { recursive: true });
    fs.writeFileSync(path.join(fixtureRoot, 'crux', 'example.json'), '{"data": "test"}', 'utf-8');
    fs.writeFileSync(path.join(fixtureRoot, 'crux', 'bad.json'), '{ bad json', 'utf-8');
  });

  afterEach(() => {
    if (fs.existsSync(fixtureRoot)) {
      fs.rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });

  it('load a real fixture returns parsed object', async () => {
    const res = await adapter.load('crux', 'example');
    expect(res).toEqual({ data: 'test' });
  });

  it('load missing file returns null', async () => {
    const res = await adapter.load('crux', 'missing');
    expect(res).toBeNull();
  });

  it('load malformed file throws with the file path in the message', async () => {
    await expect(adapter.load('crux', 'bad')).rejects.toThrow(/Malformed JSON in.*bad\.json/);
  });

  it('load with ../etc/passwd key throws', async () => {
    await expect(adapter.load('crux', '../etc/passwd')).rejects.toThrow('Path traversal is rejected');
  });

  it('has() returns true for existing, false for missing', () => {
    expect(adapter.has('crux', 'example')).toBe(true);
    expect(adapter.has('crux', 'missing')).toBe(false);
  });
});
