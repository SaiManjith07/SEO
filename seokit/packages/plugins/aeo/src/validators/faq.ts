import { ExecutionPlan, VerificationEvidence, ValidatorPlugin, FixPlan } from '@seokit/core';
import * as cheerio from 'cheerio';

export const aeoFaqValidator: ValidatorPlugin = {
  id: 'aeo-faq-validator',
  version: '1.0.0',
  async execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence> {
    const html = context.rawHtml || context.pageHtml || '';
    if (!html) {
      return { passed: true, confidence: 1.0, output: 'No HTML available.', source: 'aeo-faq-validator' };
    }

    const $ = cheerio.load(html);
    const scripts = $('script[type="application/ld+json"]');
    
    let hasFAQ = false;
    scripts.each((_, el) => {
      try {
        const data = JSON.parse($(el).html() ?? '');
        const type = data['@type'];
        if (type === 'FAQPage' || (Array.isArray(type) && type.includes('FAQPage'))) {
          hasFAQ = true;
        }
      } catch {
        // ignore
      }
    });

    if (!hasFAQ) {
      const fix: FixPlan = {
        ruleId: 'aeo.faq.schema',
        description: 'Page lacks structured FAQPage JSON-LD metadata.',
        suggestedFix: 'Incorporate an FAQPage schema markup referencing the questions answered in heading titles.',
        targetFile: context.filePath
      };

      return {
        passed: false,
        confidence: 1.0,
        output: 'FAQ Schema check failed: No FAQPage JSON-LD schemas detected.',
        source: 'aeo-faq-validator',
        fixPlan: fix
      };
    }

    return {
      passed: true,
      confidence: 1.0,
      output: 'FAQPage structured JSON-LD schema validated successfully.',
      source: 'aeo-faq-validator'
    };
  }
};
