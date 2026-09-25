import { describe, it, expect } from 'vitest';
import { CertificationSuite } from '@seokit/core';
import { seoPlugin } from './index.js';

describe('SEO Plugin Certification', () => {
  it('should pass platform certification', () => {
    const suite = new CertificationSuite();
    const result = suite.certifyPlugin(seoPlugin);
    
    expect(result.errors).toEqual([]);
    expect(result.passed).toBe(true);
  });

  it('should validate OG, Twitter, Schema, and Robots using SEO plugin validators', async () => {
    const validators = seoPlugin.validators || [];
    const ogVal = validators.find((v: any) => v.id === 'opengraph-validator')?.execute;
    const twVal = validators.find((v: any) => v.id === 'twitter-validator')?.execute;
    const scVal = validators.find((v: any) => v.id === 'schema-validator')?.execute;
    const rbVal = validators.find((v: any) => v.id === 'robots-validator')?.execute;

    expect(ogVal).toBeDefined();
    expect(twVal).toBeDefined();
    expect(scVal).toBeDefined();
    expect(rbVal).toBeDefined();

    const mockHtml = `
      <html>
      <head>
        <title>Test page</title>
        <meta name="description" content="Valid description.">
        <meta property="og:title" content="OG Title">
        <meta property="og:description" content="OG Desc">
        <meta property="og:image" content="http://image.png">
        <meta name="twitter:card" content="summary">
        <meta name="twitter:title" content="Twitter Title">
        <script type="application/ld+json">
          { "@context": "https://schema.org", "@type": "WebPage", "name": "Valid Schema" }
        </script>
      </head>
      <body></body>
      </html>
    `;

    const dummyPlan: any = { capabilityId: 'seo.opengraph', validators: [], context: {} };

    const ogResult = await ogVal!(dummyPlan, { rawHtml: mockHtml });
    expect(ogResult.passed).toBe(true);

    const twResult = await twVal!(dummyPlan, { rawHtml: mockHtml });
    expect(twResult.passed).toBe(true);

    const scResult = await scVal!(dummyPlan, { rawHtml: mockHtml });
    expect(scResult.passed).toBe(true);

    const rbResult = await rbVal!(dummyPlan, { robotsTxt: 'User-agent: *\nDisallow: /admin\nSitemap: https://example.com/sitemap.xml' });
    expect(rbResult.passed).toBe(true);
  });

  it('should detect canonical noindex conflicts', async () => {
    const validators = seoPlugin.validators || [];
    const canonicalVal = validators.find((v: any) => v.id === 'canonical-validator');
    expect(canonicalVal).toBeDefined();

    const dummyPlan: any = { capabilityId: 'seo.canonical', validators: [], context: {} };

    const conflictHtml = `
      <html>
      <head>
        <link rel="canonical" href="https://example.com/test">
        <meta name="robots" content="noindex, nofollow">
      </head>
      <body></body>
      </html>
    `;
    const resultConflict = await canonicalVal!.execute(dummyPlan, { rawHtml: conflictHtml, filePath: 'index.html' });
    expect(resultConflict.passed).toBe(false);
    expect(resultConflict.output).toContain('SEO Conflict: Page has rel="canonical" but is marked as noindex.');

    const conflictHeaderHtml = `
      <html>
      <head>
        <link rel="canonical" href="https://example.com/test">
      </head>
      <body></body>
      </html>
    `;
    const resultHeaderConflict = await canonicalVal!.execute(dummyPlan, {
      rawHtml: conflictHeaderHtml,
      filePath: 'index.html',
      headers: { 'x-robots-tag': 'noindex' }
    });
    expect(resultHeaderConflict.passed).toBe(false);
    expect(resultHeaderConflict.output).toContain('SEO Conflict: Page has rel="canonical" but is marked as noindex.');
  });
});
