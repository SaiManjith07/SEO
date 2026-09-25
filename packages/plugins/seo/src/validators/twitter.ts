import { ExecutionPlan, VerificationEvidence, ValidatorPlugin } from '@seokit/core';
import * as cheerio from 'cheerio';

export const twitterValidator: ValidatorPlugin = {
  id: 'twitter-validator',
  version: '1.0.0',
  async execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence> {
    const html = context.rawHtml || context.pageHtml || '';
    if (!html) {
      return {
        passed: false,
        confidence: 1.0,
        output: 'No HTML content available for Twitter Cards verification',
        source: 'twitter-validator'
      };
    }

    const $ = cheerio.load(html);
    const card = $('meta[name="twitter:card"]').attr('content') ?? '';
    const title = $('meta[name="twitter:title"]').attr('content') ?? '';

    const missing: string[] = [];
    if (!card) missing.push('twitter:card');
    if (!title) missing.push('twitter:title');

    return {
      passed: missing.length === 0,
      confidence: 1.0,
      output: missing.length === 0 
        ? 'All essential Twitter Cards meta tags are present.' 
        : `Missing Twitter Cards meta tags: ${missing.join(', ')}`,
      source: 'twitter-validator'
    };
  }
};
