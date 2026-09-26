import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { loadConfig, saveConfig, SeoKitConfig } from './index.js';

describe('Config Loader', () => {
  const repoRoot = path.join(__dirname, 'test-repo');
  const dirPath = path.join(repoRoot, '.seokit');
  const configPath = path.join(dirPath, 'config.json');

  beforeEach(() => {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  });

  it('Missing file returns default config', () => {
    const config = loadConfig(repoRoot);
    expect(config.version).toBe(1);
    expect(config.goals.length).toBe(0);
    expect(Object.keys(config.sources).length).toBe(0);
  });

  it('Malformed JSON throws a clear error naming the file', () => {
    fs.mkdirSync(dirPath, { recursive: true });
    fs.writeFileSync(configPath, '{ bad json ]', 'utf-8');
    
    expect(() => loadConfig(repoRoot)).toThrowError(new RegExp(`Failed to parse ${configPath.replace(/\\/g, '\\\\')}`));
  });

  it('Round-trip save/load preserves structure', () => {
    const config: SeoKitConfig = {
      version: 1,
      goals: ['audit'],
      sources: {
        crux: { enabled: true, note: 'test' }
      },
      modes: {
        dev: { blockOnFail: true },
        prod: { schedule: '0 12 * * *', alertWebhook: 'https://hooks.slack.com/xyz' }
      }
    };
    
    saveConfig(repoRoot, config);
    const loaded = loadConfig(repoRoot);
    expect(loaded).toEqual(config);
  });
});
