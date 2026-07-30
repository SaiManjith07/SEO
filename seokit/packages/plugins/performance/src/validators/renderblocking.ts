import { ExecutionPlan, VerificationEvidence, ValidatorPlugin } from '@seokit/core';
import * as cheerio from 'cheerio';

export const renderblockingValidator: ValidatorPlugin = {
  id: 'renderblocking-validator',
  version: '1.0.0',
  async execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence> {
    const html = context.rawHtml || context.pageHtml || '';
    if (!html) {
      return {
        passed: true,
        confidence: 1.0,
        output: 'No HTML available for render-blocking analysis.',
        source: 'renderblocking-validator'
      };
    }

    const $ = cheerio.load(html);
    const headScripts = $('head script[src]');
    const blockingScripts: string[] = [];

    headScripts.each((_, el) => {
      const src = $(el).attr('src') ?? '';
      const isAsync = $(el).attr('async') !== undefined;
      const isDefer = $(el).attr('defer') !== undefined;
      const isModule = $(el).attr('type') === 'module';

      if (!isAsync && !isDefer && !isModule) {
        blockingScripts.push(src);
      }
    });

    return {
      passed: blockingScripts.length === 0,
      confidence: 1.0,
      output: blockingScripts.length === 0
        ? 'No blocking scripts found in the document <head>.'
        : `Render-blocking scripts detected in head: ${blockingScripts.join(', ')}. Use async/defer.`,
      source: 'renderblocking-validator'
    };
  }
};
