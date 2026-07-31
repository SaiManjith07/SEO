import { describe, it, expect } from 'vitest';
import { runRules } from '../index.js';
import type { SiteContext, PageContext } from '../types.js';

function mockPage(url: string, html: string, status = 200): PageContext {
  return {
    kind: 'page',
    url,
    status,
    headers: {},
    rawHtml: html,
  };
}

describe('Site-Level Intelligence Rules', () => {
  it('should flag thin content, duplicate content, and cannibalization', () => {
    // 2 duplicate pages with thin text
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

    // 1. Thin content findings
    const thin = findings.filter((f) => f.ruleId === 'site/thin-content');
    expect(thin).toHaveLength(2);

    // 2. Duplicate content finding
    const duplicate = findings.filter((f) => f.ruleId === 'site/duplicate-content');
    expect(duplicate).toHaveLength(1);

    // 3. Keyword cannibalization: title "About Us" and H1 "About Us"
    const cannibalization = findings.filter((f) => f.ruleId === 'site/keyword-cannibalization');
    expect(cannibalization.length).toBeGreaterThan(0);
  });

  it('should exempt duplicate content when canonical tags point to distinct URL', () => {
    const page1 = mockPage(
      'https://example.com/about',
      '<html><head><title>About Us</title></head><body><h1>About Us</h1><p>We are a cool company.</p></body></html>'
    );
    const page2 = mockPage(
      'https://example.com/about-duplicate',
      '<html><head><title>About Us</title><link rel="canonical" href="https://example.com/about"></head><body><h1>About Us</h1><p>We are a cool company.</p></body></html>'
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

    // Should not trigger duplicate content because page2 explicitly canonicalizes to page1
    const duplicate = findings.filter((f) => f.ruleId === 'site/duplicate-content');
    expect(duplicate).toHaveLength(0);
  });

  it('should enforce Jaccard cannibalization overrides and similarity thresholds', () => {
    // Highly similar but not identical titles
    const page1 = mockPage('https://example.com/a', '<html><head><title>Best SEO Tools</title></head><body><h1>SEO Tools</h1></body></html>');
    const page2 = mockPage('https://example.com/b', '<html><head><title>Top SEO Tools</title></head><body><h1>SEO Tools</h1></body></html>');

    const ctx: SiteContext = {
      kind: 'site',
      origin: 'https://example.com',
      pages: [page1, page2],
      robotsTxt: null,
      sitemapUrls: [],
      linkGraph: new Map(),
      config: {
        intelligence: {
          cannibalizationSimilarity: 0.95 // Require 95% similarity
        }
      }
    };

    const { findings } = runRules(ctx);
    
    // Title "Best SEO Tools" and "Top SEO Tools" share 2 of 4 tokens (50% similar)
    // Under 95% similarity config, the title similarity check passes without warnings!
    const titleCannibalization = findings.filter(
      (f) => f.ruleId === 'site/keyword-cannibalization' && f.message.includes('title')
    );
    expect(titleCannibalization).toHaveLength(0);
  });

  it('should detect orphan pages and support exclusions', () => {
    const home = mockPage('https://example.com/', '<html><head><title>Home</title></head><body><h1>Home</h1></body></html>');
    
    const orphan1 = mockPage('https://example.com/landing-promo-1', '<html><head><title>Promo 1</title></head><body><h1>Promo</h1></body></html>');
    const orphanRedirect = mockPage('https://example.com/redirected', '<html></html>', 301);
    const orphanNoindex = mockPage('https://example.com/noindex-page', '<html><head><meta name="robots" content="noindex"></head></html>');

    const ctx: SiteContext = {
      kind: 'site',
      origin: 'https://example.com',
      pages: [home, orphan1, orphanRedirect, orphanNoindex],
      robotsTxt: null,
      sitemapUrls: [],
      linkGraph: new Map([
        ['https://example.com/', []],
      ]),
      config: {
        intelligence: {
          orphanExclusions: ['promo-1'] // Exclude orphan1 from checks
        }
      }
    };

    const { findings } = runRules(ctx);

    const orphans = findings.filter((f) => f.ruleId === 'site/orphan-pages');
    // None should be flagged since orphan1 matches exclusion, redirect is skipped, and noindex is skipped!
    expect(orphans).toHaveLength(0);
  });

  it('should verify E-E-A-T trust signals (SSL and author schemas)', () => {
    const home = mockPage('http://example.com/', '<html><head><title>Home</title></head><body><h1>Home</h1></body></html>');
    const blog = mockPage(
      'https://example.com/blog/great-tips',
      '<html><head><title>Blog Post</title></head><body><h1>Blog</h1><p>Useful context words...</p></body></html>'
    );

    const ctx: SiteContext = {
      kind: 'site',
      origin: 'https://example.com',
      pages: [home, blog],
      robotsTxt: null,
      sitemapUrls: [],
      linkGraph: new Map()
    };

    const { findings } = runRules(ctx);

    // Should flag http protocol on home
    const ssl = findings.find((f) => f.ruleId === 'site/eeat-trust-pages' && f.message.includes('HTTP protocol'));
    expect(ssl).toBeDefined();

    // Should flag lack of author schema on blog article page
    const author = findings.find((f) => f.ruleId === 'site/eeat-trust-pages' && f.message.includes('lacks explicit structured author'));
    expect(author).toBeDefined();
  });
});
