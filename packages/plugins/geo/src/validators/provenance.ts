import { ExecutionPlan, VerificationEvidence, ValidatorPlugin, FixPlan } from '@seokit/core';
import * as cheerio from 'cheerio';

export const geoProvenanceValidator: ValidatorPlugin = {
  id: 'geo-provenance-validator',
  version: '1.0.0',
  async execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence> {
    const html = context.rawHtml || context.pageHtml || '';
    if (!html) {
      return { passed: true, confidence: 1.0, output: 'No HTML available.', source: 'geo-provenance-validator' };
    }

    const $ = cheerio.load(html);
    const scripts = $('script[type="application/ld+json"]');
    let hasDates = false;

    const searchDates = (obj: any): boolean => {
      if (!obj || typeof obj !== 'object') return false;
      if (Array.isArray(obj)) {
        return obj.some(item => searchDates(item));
      }
      if (obj.datePublished || obj.dateModified) {
        return true;
      }
      for (const k of Object.keys(obj)) {
        if (searchDates(obj[k])) return true;
      }
      return false;
    };

    scripts.each((_, el) => {
      try {
        const data = JSON.parse($(el).html() ?? '');
        if (searchDates(data)) {
          hasDates = true;
        }
      } catch {
        // ignore
      }
    });

    if (!hasDates) {
      const fix: FixPlan = {
        ruleId: 'geo.provenance.dates',
        description: 'Missing content creation or update timestamps.',
        suggestedFix: 'Incorporate datePublished and dateModified attributes in structured JSON-LD.',
        targetFile: context.filePath
      };

      return {
        passed: false,
        confidence: 1.0,
        output: 'GEO check failed: Missing structured date metadata signals.',
        source: 'geo-provenance-validator',
        fixPlan: fix
      };
    }

    return {
      passed: true,
      confidence: 1.0,
      output: 'Content provenance timestamp signals verified successfully.',
      source: 'geo-provenance-validator'
    };
  }
};
