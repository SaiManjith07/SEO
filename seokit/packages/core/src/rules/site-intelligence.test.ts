import { describe, it, expect } from 'vitest';
import { runRules } from '../index.js';
import type { SiteContext, PageContext } from '../types.js';

function mockPage(url: string, html: string): PageContext {
  return {
    kind: 'page',
    url,
    status: 200,
    headers: {},
    rawHtml: html,
  };
}

describe('Site-Level Intelligence Rules', () => {
  it('should flag thin content, duplicate content, and cannibalization', () => {
    // 2 duplicate pages with thin text, 1 page with distinct text
    const page1 = mockPage(
      'https://example.com/about',
      '<html><head><title>About Us</title></head><body><h1>About Us</h1><p>We are a cool company.</p></body></html>'
    );
    const page2 = mockPage(
      'https://example.com/about-duplicate',
      '<html><head><title>About Us</title></head><body><h1>About Us</h1><p>We are a cool company.</p></body></html>'
    );

    const ctx: SiteContext = {
      kind: 'site',
      origin: 'https://example.com',
      pages: [page1, page2],
      robotsTxt: null,
      sitemapUrls: [],
      linkGraph: new Map([
        ['https://example.com/about', ['https://example.com/about-duplicate']],
      ]),
    };

    const { findings } = runRules(ctx);

    // 1. Thin content findings: both page1 and page2 have <200 words
    const thin = findings.filter((f) => f.ruleId === 'site/thin-content');
    expect(thin).toHaveLength(2);

    // 2. Duplicate content finding: page1 and page2 are duplicate
    const duplicate = findings.filter((f) => f.ruleId === 'site/duplicate-content');
    expect(duplicate).toHaveLength(1);

    // 3. Keyword cannibalization: both have identical title "About Us" and H1 "About Us"
    const cannibalization = findings.filter((f) => f.ruleId === 'site/keyword-cannibalization');
    expect(cannibalization.length).toBeGreaterThan(0);
  });

  it('should detect orphan pages and verify E-E-A-T signals', () => {
    // Page 2 is not linked from anywhere in the linkGraph (orphan)
    const home = mockPage('https://example.com/', '<html><head><title>Home</title></head><body><h1>Home</h1></body></html>');
    const pageOrphan = mockPage(
      'https://example.com/orphan',
      '<html><head><title>Orphan Page</title></head><body><h1>Orphan Page</h1></body></html>'
    );

    const ctx: SiteContext = {
      kind: 'site',
      origin: 'https://example.com',
      pages: [home, pageOrphan],
      robotsTxt: null,
      sitemapUrls: [],
      linkGraph: new Map([
        ['https://example.com/', []],
      ]),
    };

    const { findings } = runRules(ctx);

    // 1. Orphan page finding
    const orphans = findings.filter((f) => f.ruleId === 'site/orphan-pages');
    expect(orphans).toHaveLength(1);
    expect(orphans[0].message).toContain('orphan');

    // 2. E-E-A-T Signal checks: neither Privacy, Contact, nor About pages exist
    const eeat = findings.filter((f) => f.ruleId === 'site/eeat-trust-pages');
    expect(eeat).toHaveLength(3); // About, Contact, Privacy policy
  });
});
