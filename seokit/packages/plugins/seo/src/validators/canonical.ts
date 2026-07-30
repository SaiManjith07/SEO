import { ExecutionPlan, VerificationEvidence, ValidatorPlugin, FixPlan } from '@seokit/core';
import * as cheerio from 'cheerio';

export const canonicalValidator: ValidatorPlugin = {
  id: 'canonical-validator',
  version: '1.0.0',
  async execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence> {
    const html = context.rawHtml || context.pageHtml || '';
    if (!html) {
      return {
        passed: false,
        confidence: 1.0,
        output: 'No HTML content available for canonical verification',
        source: 'canonical-validator'
      };
    }

    const $ = cheerio.load(html);
    const canonical = $('link[rel="canonical"]').attr('href') ?? '';
    
    if (!canonical) {
      return {
        passed: false,
        confidence: 1.0,
        output: 'Missing canonical URL link tag',
        source: 'canonical-validator',
        fixPlan: {
          ruleId: 'seo.canonical.exists',
          description: 'No rel="canonical" link element found on page.',
          suggestedFix: 'Add <link rel="canonical" href="https://example.com/page-url"> inside the head.',
          targetFile: context.filePath
        }
      };
    }

    // Cross-validate indexability conflicts
    const robotsMeta = $('meta[name="robots"]').attr('content') ?? '';
    const googlebotMeta = $('meta[name="googlebot"]').attr('content') ?? '';
    const hasNoIndexMeta = /noindex/i.test(robotsMeta) || /noindex/i.test(googlebotMeta);

    const xRobotsTag = context.headers?.['x-robots-tag'] ?? '';
    const hasNoIndexHeader = /noindex/i.test(xRobotsTag);

    if ((hasNoIndexMeta || hasNoIndexHeader) && canonical) {
      return {
        passed: false,
        confidence: 1.0,
        output: 'SEO Conflict: Page has rel="canonical" but is marked as noindex.',
        source: 'canonical-validator',
        fixPlan: {
          ruleId: 'seo.canonical.exists',
          description: 'Canonical tag conflicts with noindex robots configuration.',
          suggestedFix: 'Remove the noindex attribute from robots meta/headers if the page should be indexed, or remove the canonical tag if indexation is undesired.',
          targetFile: context.filePath
        }
      };
    }

    const isAbsolute = /^https?:\/\//i.test(canonical);
    if (!isAbsolute) {
      return {
        passed: false,
        confidence: 1.0,
        output: `Invalid relative canonical URL: "${canonical}". Absolute URL required.`,
        source: 'canonical-validator',
        fixPlan: {
          ruleId: 'seo.canonical.exists',
          description: 'Relative rel="canonical" link element found.',
          suggestedFix: `Update rel="canonical" link tag to use absolute URL instead of "${canonical}".`,
          targetFile: context.filePath
        }
      };
    }

    return {
      passed: true,
      confidence: 1.0,
      output: `Canonical absolute URL verified: ${canonical}`,
      source: 'canonical-validator'
    };
  }
};
