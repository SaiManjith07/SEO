import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigLoader, mergeConfigs, matchesGlob } from './config.js';

describe('SEOKit v3 Config & Projects Subsystem Tests', () => {
  const tmpDir = path.resolve('tmp_config_test');

  beforeAll(() => {
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('should match files correctly using glob pattern strings', () => {
    expect(matchesGlob('src/components/button.tsx', '**/button.tsx')).toBe(true);
    expect(matchesGlob('temp/debug.log', 'temp/**')).toBe(true);
    expect(matchesGlob('src/app.ts', 'temp/**')).toBe(false);
  });

  it('should deeply merge two configs', () => {
    const configA = {
      profile: 'basic' as const,
      plugins: ['@seokit/plugin-seo'],
      ignore: ['**/node_modules/**']
    };

    const configB = {
      profile: 'advanced' as const,
      plugins: ['@seokit/plugin-security'],
      ignore: ['**/temp/**'],
      rules: {
        'seo.canonical.exists': { enabled: false }
      }
    };

    const merged = mergeConfigs(configA, configB);
    expect(merged.profile).toBe('advanced');
    expect(merged.plugins).toContain('@seokit/plugin-seo');
    expect(merged.plugins).toContain('@seokit/plugin-security');
    expect(merged.ignore).toContain('**/node_modules/**');
    expect(merged.ignore).toContain('**/temp/**');
    expect(merged.rules?.['seo.canonical.exists']?.enabled).toBe(false);
  });

  it('should throw an error on invalid configuration schemas', () => {
    const invalidConfig = {
      profile: 'super-advanced'
    };
    expect(() => ConfigLoader.validate(invalidConfig)).toThrow('Invalid profile');
  });

  it('should throw on unrecognized keys (strict validation)', () => {
    const unknownConfig = {
      profile: 'basic',
      invalidKey: true
    };
    expect(() => ConfigLoader.validate(unknownConfig)).toThrow('Unknown property "invalidKey"');
  });

  it('should validate configuration schemaVersion formats', () => {
    const invalidVersion = {
      schemaVersion: 123 // must be string
    };
    expect(() => ConfigLoader.validate(invalidVersion)).toThrow('schemaVersion must be a valid string');
  });

  it('should throw circular reference errors on inheritance extends loops', () => {
    const cyclicA = {
      extends: './seokit.config.js'
    };

    fs.writeFileSync(path.join(tmpDir, 'seokit.config.js'), `module.exports = ${JSON.stringify(cyclicA)};`);

    expect(() => ConfigLoader.load(tmpDir)).toThrow('Circular inheritance detected');
  });

  it('should load configuration files from project directories', () => {
    const testConfig = {
      schemaVersion: '3.0.0',
      profile: 'marketing',
      ignore: ['**/dist/**'],
      rules: {
        'seo.canonical.exists': { severity: 'warning' }
      }
    };

    fs.writeFileSync(path.join(tmpDir, 'seokit.config.json'), JSON.stringify(testConfig, null, 2));

    const loaded = ConfigLoader.load(tmpDir);
    expect(loaded.schemaVersion).toBe('3.0.0');
    expect(loaded.profile).toBe('marketing');
    expect(loaded.ignore).toContain('**/dist/**');
    expect(loaded.rules?.['seo.canonical.exists']?.severity).toBe('warning');
  });

  it('should load environment specific configuration overrides', () => {
    const testConfig = {
      profile: 'basic',
      environments: {
        production: {
          profile: 'advanced',
          ignore: ['**/test/**']
        }
      }
    };

    fs.writeFileSync(path.join(tmpDir, 'seokit.config.json'), JSON.stringify(testConfig, null, 2));

    const loadedDev = ConfigLoader.load(tmpDir, 'development');
    expect(loadedDev.profile).toBe('basic');

    const loadedProd = ConfigLoader.load(tmpDir, 'production');
    expect(loadedProd.profile).toBe('advanced');
    expect(loadedProd.ignore).toContain('**/test/**');
  });
});
