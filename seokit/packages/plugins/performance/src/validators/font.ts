import { ExecutionPlan, VerificationEvidence, ValidatorPlugin } from '@seokit/core';
import * as cheerio from 'cheerio';

export const fontValidator: ValidatorPlugin = {
  id: 'font-validator',
  version: '1.0.0',
  async execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence> {
    const html = context.rawHtml || context.pageHtml || '';
    if (!html) {
      return {
        passed: true,
        confidence: 1.0,
        output: 'No HTML available for font preloading validations.',
        source: 'font-validator'
      };
    }

    const $ = cheerio.load(html);
    const fontsPreloaded = $('link[rel="preload"][as="font"]').length > 0;
    
    return {
      passed: fontsPreloaded || !html.includes('@font-face'),
      confidence: 1.0,
      output: fontsPreloaded 
        ? 'Custom web fonts are properly preloaded using rel="preload" tags.'
        : 'Web fonts optimization: Consider preloading critical web fonts to avoid layout shifts.',
      source: 'font-validator'
    };
  }
};
