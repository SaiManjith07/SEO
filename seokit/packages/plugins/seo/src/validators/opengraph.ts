import { ExecutionPlan, VerificationEvidence, ValidatorPlugin } from '@seokit/core';
import * as cheerio from 'cheerio';

export const opengraphValidator: ValidatorPlugin = {
  id: 'opengraph-validator',
  version: '1.0.0',
  async execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence> {
    const html = context.rawHtml || context.pageHtml || '';
    if (!html) {
      return {
        passed: false,
        confidence: 1.0,
        output: 'No HTML content available for Open Graph verification',
        source: 'opengraph-validator'
      };
    }

    const $ = cheerio.load(html);
    const ogTitle = $('meta[property="og:title"]').attr('content') ?? '';
    const ogDesc = $('meta[property="og:description"]').attr('content') ?? '';
    const ogImage = $('meta[property="og:image"]').attr('content') ?? '';

    const missing: string[] = [];
    if (!ogTitle) missing.push('og:title');
    if (!ogDesc) missing.push('og:description');
    if (!ogImage) missing.push('og:image');

    return {
      passed: missing.length === 0,
      confidence: 1.0,
      output: missing.length === 0 
        ? 'All essential Open Graph meta tags are present.' 
        : `Missing Open Graph meta tags: ${missing.join(', ')}`,
      source: 'opengraph-validator'
    };
  }
};
