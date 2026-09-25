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
    const searchFAQ = (obj: any): boolean => {
      if (!obj || typeof obj !== 'object') return false;
      if (Array.isArray(obj)) {
        return obj.some(item => searchFAQ(item));
      }
      const type = obj['@type'];
      const matchesType = type === 'FAQPage' || (Array.isArray(type) && type.includes('FAQPage'));
      if (matchesType) {
        return true;
      }
      for (const k of Object.keys(obj)) {
        if (searchFAQ(obj[k])) return true;
      }
      return false;
    };

    scripts.each((_, el) => {
      try {
        const data = JSON.parse($(el).html() ?? '');
        if (searchFAQ(data)) {
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
