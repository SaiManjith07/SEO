import { ExecutionPlan, VerificationEvidence, ValidatorPlugin } from '@seokit/core';
import * as cheerio from 'cheerio';

export const metadataValidator: ValidatorPlugin = {
  id: 'metadata-validator',
  version: '1.0.0',
  async execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence> {
    const html = context.rawHtml || context.pageHtml || '';
    if (!html) {
      return {
        passed: false,
        confidence: 1.0,
        output: 'No HTML content available for metadata verification',
        source: 'metadata-validator'
      };
    }

    const $ = cheerio.load(html);
    const title = $('title').text().trim();
    const desc = $('meta[name="description"]').attr('content') ?? '';

    const missing: string[] = [];
    if (!title) missing.push('title');
    if (!desc) missing.push('meta description');

    if (missing.length > 0) {
      return {
        passed: false,
        confidence: 1.0,
        output: `Missing metadata elements: ${missing.join(', ')}`,
        source: 'metadata-validator'
      };
    }

    return {
      passed: true,
      confidence: 1.0,
      output: 'Page metadata tags verified successfully.',
      source: 'metadata-validator'
    };
  }
};
