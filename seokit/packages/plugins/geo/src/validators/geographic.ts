import { ExecutionPlan, VerificationEvidence, ValidatorPlugin, FixPlan } from '@seokit/core';
import * as cheerio from 'cheerio';

export const geoGeographicValidator: ValidatorPlugin = {
  id: 'geo-geographic-validator',
  version: '1.0.0',
  async execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence> {
    const html = context.rawHtml || context.pageHtml || '';
    if (!html) {
      return { passed: true, confidence: 1.0, output: 'No HTML available.', source: 'geo-geographic-validator' };
    }

    const $ = cheerio.load(html);
    const scripts = $('script[type="application/ld+json"]');
    let hasAddress = false;

    scripts.each((_, el) => {
      try {
        const data = JSON.parse($(el).html() ?? '');
        
        const type = data['@type'];
        const isLocalOrOrg = type === 'Organization' || type === 'LocalBusiness' || type === 'Place';
        const address = data.address ?? data.location?.address;
        
        if (isLocalOrOrg && address) {
          hasAddress = true;
        }
      } catch {
        // ignore
      }
    });

    if (!hasAddress) {
      const fix: FixPlan = {
        ruleId: 'geo.geographic.address',
        description: 'Missing geographic coordinates or address indicators in schema markup.',
        suggestedFix: 'Incorporate a valid "address" property or LocalBusiness schema block.',
        targetFile: context.filePath
      };

      return {
        passed: false,
        confidence: 1.0,
        output: 'GEO check failed: Missing structured geographic location signals.',
        source: 'geo-geographic-validator',
        fixPlan: fix
      };
    }

    return {
      passed: true,
      confidence: 1.0,
      output: 'Geographic entity structure validated successfully.',
      source: 'geo-geographic-validator'
    };
  }
};
