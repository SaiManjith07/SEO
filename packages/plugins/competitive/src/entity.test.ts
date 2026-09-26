import { describe, it, expect } from 'vitest';
import { CompetitiveEntityPlugin } from './index';

describe('Competitive Entity Check Integration Tests', () => {
  const plugin = new CompetitiveEntityPlugin();

  it('should verify live entity presence for react.dev', async () => {
    try {
      const result = await plugin.checkEntity('react.dev');
      expect(result.hasWikidata).toBe(true);
      expect(result.wikidataId).toBe('Q19399674');
    } catch (e: any) {
      if (e.message.includes('fetch failed')) {
        console.warn('Skipping due to network failure');
      } else {
        throw e;
      }
    }
  }, 10000);
  
  it('should verify live entity presence for nextjs.org', async () => {
    try {
      const result = await plugin.checkEntity('nextjs.org');
      expect(result.hasWikidata).toBe(true);
      expect(result.wikidataId).toBe('Q56062435');
    } catch (e: any) {
      if (e.message.includes('fetch failed')) {
        console.warn('Skipping due to network failure');
      } else {
        throw e;
      }
    }
  }, 10000);
});
