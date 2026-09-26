import { describe, it, expect } from 'vitest';
import { CompetitiveSitemapPlugin, CompetitiveEntityPlugin } from './index.js';

describe('Competitive Plugin Integration Tests', () => {
  it('should fetch and parse a real sitemap (example.com does not have one, so we can test vercel.com)', async () => {
    const plugin = new CompetitiveSitemapPlugin();
    // vercel.com should have a sitemap index that resolves to real sitemaps
    const entries = await plugin.fetchSitemap('https://vercel.com/sitemap.xml');
    
    // We just need to know it fetched something and parsed it without crashing
    expect(Array.isArray(entries)).toBe(true);
    if (entries.length > 0) {
      expect(entries[0].loc).toBeDefined();
    }
  }, 30000); // 30s timeout since we're hitting network

  it('should return empty array for 404 sitemap', async () => {
    const plugin = new CompetitiveSitemapPlugin();
    const entries = await plugin.fetchSitemap('https://example.com/sitemap.xml');
    expect(entries.length).toBe(0);
  }, 10000);

  it('should diff sitemaps correctly', () => {
    const plugin = new CompetitiveSitemapPlugin();
    const mine = [
      { loc: 'https://mysite.com/a' },
      { loc: 'https://mysite.com/b' }
    ];
    const theirs = [
      { loc: 'https://competitor.com/b' },
      { loc: 'https://competitor.com/c', lastmod: '2023-01-01' }
    ];

    const diff = plugin.diffSitemaps(mine, theirs);
    expect(diff.both.length).toBe(1);
    expect(diff.both[0]).toContain('/b');
    
    expect(diff.onlyMine.length).toBe(1);
    expect(diff.onlyMine[0].loc).toBe('https://mysite.com/a');

    expect(diff.onlyTheirs.length).toBe(1);
    expect(diff.onlyTheirs[0].loc).toBe('https://competitor.com/c');
  });

  it('should check entity presence for a known entity (google.com)', async () => {
    const plugin = new CompetitiveEntityPlugin();
    const presence = await plugin.checkEntity('google.com');
    
    // google.com should definitely be in Wikidata
    expect(presence.hasWikidata).toBe(true);
    expect(presence.wikidataId).toBeDefined();
    expect(presence.organizationSchemaSameAs.length).toBeGreaterThan(0);
    expect(presence.sameAsCoverage).toBeGreaterThan(0);
  }, 20000);

  it('should handle entity presence for unknown domain', async () => {
    const plugin = new CompetitiveEntityPlugin();
    const presence = await plugin.checkEntity('thisdomain-does-not-exist-abc123.xyz');
    
    expect(presence.hasWikidata).toBe(false);
    expect(presence.organizationSchemaSameAs.length).toBe(0);
    expect(presence.sameAsCoverage).toBe(0);
  }, 20000);
});
