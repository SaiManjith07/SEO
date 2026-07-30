import { ExecutionPlan, VerificationEvidence, ValidatorPlugin } from '@seokit/core';

export const sitemapValidator: ValidatorPlugin = {
  id: 'sitemap-validator',
  version: '1.0.0',
  async execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence> {
    const sitemapXml = context.sitemapXml || '';
    if (!sitemapXml) {
      return {
        passed: false,
        confidence: 1.0,
        output: 'Missing sitemap.xml content',
        source: 'sitemap-validator'
      };
    }

    const isXml = sitemapXml.trim().startsWith('<?xml') || sitemapXml.includes('<urlset');
    if (!isXml) {
      return {
        passed: false,
        confidence: 1.0,
        output: 'Sitemap.xml is not in valid XML format (missing XML header or urlset node).',
        source: 'sitemap-validator'
      };
    }

    // Deep checks: Duplicate URLs
    const locs = sitemapXml.match(/<loc>(.*?)<\/loc>/g) || [];
    const urls = locs.map((l: string) => l.replace(/<\/?loc>/g, '').trim());
    
    const seenUrls = new Set<string>();
    const duplicateUrls: string[] = [];
    for (const url of urls) {
      if (seenUrls.has(url)) {
        duplicateUrls.push(url);
      } else {
        seenUrls.add(url);
      }
    }

    const issues: string[] = [];
    if (duplicateUrls.length > 0) {
      issues.push(`Duplicate URLs detected in sitemap: ${duplicateUrls.join(', ')}`);
    }

    return {
      passed: issues.length === 0,
      confidence: 1.0,
      output: issues.length === 0
        ? `Sitemap.xml contains valid XML and successfully parsed ${urls.length} URLs.`
        : `Sitemap issues: ${issues.join('; ')}`,
      source: 'sitemap-validator'
    };
  }
};
