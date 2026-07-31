import { describe, it, expect } from 'vitest';
import { ConfigurationProvider } from './provider.js';
import type { SeoKitConfig } from '../types.js';

describe('ConfigurationProvider settings resolution', () => {
  it('should resolve default settings when no user config is provided', () => {
    const provider = new ConfigurationProvider();
    const settings = provider.getSettings();

    expect(settings.intelligence.thinContentThreshold).toBe(200);
    expect(settings.html.maxTitleLength).toBe(60);
    expect(settings.sandbox.cpuTimeoutMs).toBe(3000);
  });

  it('should override global intelligence options', () => {
    const userConfig: SeoKitConfig = {
      intelligence: {
        thinContentThreshold: 50,
        duplicateSimilarity: 0.90,
        orphanExclusions: ['test-url']
      }
    };

    const provider = new ConfigurationProvider(userConfig);
    const settings = provider.getSettings();

    expect(settings.intelligence.thinContentThreshold).toBe(50);
    expect(settings.intelligence.duplicateSimilarity).toBe(0.90);
    expect(settings.intelligence.orphanExclusions).toContain('test-url');
    // Keeps fallback defaults for others
    expect(settings.html.maxTitleLength).toBe(60);
  });

  it('should resolve options from specific rule rules configurations', () => {
    const userConfig: SeoKitConfig = {
      rules: {
        'html/title-length': ['warning', { maxTitleLength: 75 }]
      }
    };

    const provider = new ConfigurationProvider(userConfig);
    const settings = provider.getSettings();

    expect(settings.html.maxTitleLength).toBe(75);
  });
});
