import * as fs from 'fs';
import * as path from 'path';

export interface FixtureAdapter {
  load(sourceId: string, key: string): Promise<unknown>;
  has(sourceId: string, key: string): boolean;
  hasAny?(sourceId: string): boolean;
}

export function createFixtureAdapter(fixtureRoot: string): FixtureAdapter {
  return {
    async load(sourceId: string, key: string): Promise<unknown> {
      if (key.includes('../') || key.includes('..\\')) {
        throw new Error('Path traversal is rejected');
      }
      const filePath = path.join(fixtureRoot, sourceId, `${key}.json`);
      if (!fs.existsSync(filePath)) {
        return null;
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      try {
        return JSON.parse(content);
      } catch (err: any) {
        throw new Error(`Malformed JSON in ${filePath}: ${err.message}`);
      }
    },
    has(sourceId: string, key: string): boolean {
      if (key.includes('../') || key.includes('..\\')) {
        return false;
      }
      const filePath = path.join(fixtureRoot, sourceId, `${key}.json`);
      return fs.existsSync(filePath);
    },
    hasAny(sourceId: string): boolean {
      const dir = path.join(fixtureRoot, sourceId);
      if (!fs.existsSync(dir)) return false;
      const files = fs.readdirSync(dir);
      return files.some(f => f.endsWith('.json') || f.endsWith('.xml') || f.endsWith('.txt'));
    }
  };
}
