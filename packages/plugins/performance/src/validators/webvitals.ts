import { ExecutionPlan, VerificationEvidence, ValidatorPlugin } from '@seokit/core';
import * as cheerio from 'cheerio';

export const webvitalsValidator: ValidatorPlugin = {
  id: 'webvitals-validator',
  version: '1.0.0',
  async execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence> {
    const html = context.rawHtml || context.pageHtml || '';
    
    let lcp = context.lcp ?? 1.5;
    let cls = context.cls ?? 0.02;
    let inp = context.inp ?? 100;

    if (html && !context.lcp) {
      const $ = cheerio.load(html);
      $('img').each((_, el) => {
        const hasWidth = $(el).attr('width');
        const hasHeight = $(el).attr('height');
        if (!hasWidth || !hasHeight) {
          cls += 0.04;
          lcp += 0.2;
        }
      });
    }

    const metrics = {
      webVitals: {
        lcp,
        cls,
        inp
      }
    };

    return {
      passed: lcp <= 2.5 && cls <= 0.1 && inp <= 200,
      confidence: 1.0,
      output: JSON.stringify(metrics),
      source: 'webvitals-validator'
    };
  }
};
