import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { builtinSources } from './catalog.js';
import { suggest } from './suggest.js';
import { checkSource } from './check.js';
import { onboard } from './onboard.js';

describe('Sources Package', () => {
  it('catalog has 9 entries with required fields', () => {
    expect(builtinSources.length).toBe(9);
    for (const s of builtinSources) {
      expect(s.id).toBeDefined();
      expect(s.provides).toBeDefined();
      expect(s.modes).toBeDefined();
      expect(s.cost).toBeDefined();
      expect(s.suggestFor).toBeDefined();
    }
  });

  it('suggest() returns the right buckets for each goal', () => {
    const res = suggest(['performance']);
    expect(res.recommended.some(s => s.id === 'crux')).toBe(true);
    expect(res.optional.some(s => s.id === 'gsc')).toBe(true);
    
    // Free bucket without creds
    expect(res.free.some(s => s.id === 'wikidata')).toBe(true);
    expect(res.free.some(s => s.id === 'crux')).toBe(false); // crux requires creds
  });

  it('checkSource handles missing creds, present creds, network', () => {
    const crux = builtinSources.find(s => s.id === 'crux')!;
    const res1 = checkSource(crux, {});
    expect(res1.configured).toBe(false);
    expect(res1.credentialsMissing).toContain('CRUX_API_KEY');

    const res2 = checkSource(crux, { CRUX_API_KEY: 'test' });
    expect(res2.configured).toBe(true);
    expect(res2.credentialsPresent).toContain('CRUX_API_KEY');

    const wikidata = builtinSources.find(s => s.id === 'wikidata')!;
    const res3 = checkSource(wikidata, {});
    expect(res3.configured).toBe(true);
    expect(res3.reachable).toBe(true);
  });

  describe('onboard()', () => {
    const repoRoot = path.join(__dirname, 'test-repo');
    const dirPath = path.join(repoRoot, '.seokit');

    beforeEach(() => {
      if (fs.existsSync(dirPath)) fs.rmSync(dirPath, { recursive: true, force: true });
    });
    afterEach(() => {
      if (fs.existsSync(dirPath)) fs.rmSync(dirPath, { recursive: true, force: true });
    });

    it('runs non-interactively when TTY absent', async () => {
      // Create a config with a goal
      fs.mkdirSync(dirPath, { recursive: true });
      fs.writeFileSync(path.join(dirPath, 'config.json'), JSON.stringify({
        version: 1,
        goals: ['performance'],
        sources: {},
        modes: {}
      }));
      
      const isTTYOriginal = process.stdout.isTTY;
      process.stdout.isTTY = false;
      
      await onboard(repoRoot);
      
      process.stdout.isTTY = isTTYOriginal;
      
      const saved = JSON.parse(fs.readFileSync(path.join(dirPath, 'config.json'), 'utf-8'));
      expect(saved.sources['crux'].enabled).toBe(true);
    });
  });
});
