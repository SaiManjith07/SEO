import { ExecutionPlan, VerificationEvidence, ValidatorPlugin } from '@seokit/core';
import * as cheerio from 'cheerio';

export const bundleValidator: ValidatorPlugin = {
  id: 'bundle-validator',
  version: '1.0.0',
  async execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence> {
    const html = context.rawHtml || context.pageHtml || '';
    if (!html) {
      return {
        passed: true,
        confidence: 1.0,
        output: 'No HTML available for bundle weight calculations.',
        source: 'bundle-validator'
      };
    }

    const $ = cheerio.load(html);
    const scripts = $('script[src]');
    const totalScripts = scripts.length;
    const maxScripts = plan.context?.maxScripts ?? 8;

    return {
      passed: totalScripts <= maxScripts,
      confidence: 1.0,
      output: totalScripts <= maxScripts
        ? `Script tags count (${totalScripts}) is within target limit (${maxScripts}).`
        : `Total script tags (${totalScripts}) exceeds target limit (${maxScripts}).`,
      source: 'bundle-validator'
    };
  }
};
