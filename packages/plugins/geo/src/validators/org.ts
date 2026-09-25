import { ExecutionPlan, VerificationEvidence, ValidatorPlugin, FixPlan } from '@seokit/core';
import * as cheerio from 'cheerio';

export const geoOrgValidator: ValidatorPlugin = {
  id: 'geo-org-validator',
  version: '1.0.0',
  async execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence> {
    const html = context.rawHtml || context.pageHtml || '';
    if (!html) {
      return { passed: true, confidence: 1.0, output: 'No HTML available.', source: 'geo-org-validator' };
    }

    const $ = cheerio.load(html);
    const scripts = $('script[type="application/ld+json"]');
    let hasOrg = false;

    const searchOrg = (obj: any): boolean => {
      if (!obj || typeof obj !== 'object') return false;
      if (Array.isArray(obj)) {
        return obj.some(item => searchOrg(item));
      }
      const type = obj['@type'];
      const matchesType = type === 'Organization' || (Array.isArray(type) && type.includes('Organization'));
      if (matchesType && obj.name && obj.url) {
        return true;
      }
      for (const k of Object.keys(obj)) {
        if (searchOrg(obj[k])) return true;
      }
      return false;
    };

    scripts.each((_, el) => {
      try {
        const data = JSON.parse($(el).html() ?? '');
        if (searchOrg(data)) {
          hasOrg = true;
        }
      } catch {
        // ignore
      }
    });

    if (!hasOrg) {
      const fix: FixPlan = {
        ruleId: 'geo.org.schema',
        description: 'Missing valid Organization JSON-LD schema with name and URL.',
        suggestedFix: 'Add a JSON-LD Organization block defining "name" and "url" properties.',
        targetFile: context.filePath
      };

      return {
        passed: false,
        confidence: 1.0,
        output: 'GEO check failed: Missing valid Organization JSON-LD block.',
        source: 'geo-org-validator',
        fixPlan: fix
      };
    }

    return {
      passed: true,
      confidence: 1.0,
      output: 'Organization JSON-LD schema validated successfully.',
      source: 'geo-org-validator'
    };
  }
};
