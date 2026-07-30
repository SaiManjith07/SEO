import { ExecutionPlan, VerificationEvidence, ValidatorPlugin, FixPlan } from '@seokit/core';
import * as cheerio from 'cheerio';

export const geoKnowledgeValidator: ValidatorPlugin = {
  id: 'geo-knowledge-validator',
  version: '1.0.0',
  async execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence> {
    const html = context.rawHtml || context.pageHtml || '';
    if (!html) {
      return { passed: true, confidence: 1.0, output: 'No HTML available.', source: 'geo-knowledge-validator' };
    }

    const $ = cheerio.load(html);
    const scripts = $('script[type="application/ld+json"]');
    let hasSameAs = false;

    scripts.each((_, el) => {
      try {
        const data = JSON.parse($(el).html() ?? '');
        const sameAs = data.sameAs;
        if (sameAs && (typeof sameAs === 'string' || Array.isArray(sameAs))) {
          hasSameAs = true;
        }
      } catch {
        // ignore
      }
    });

    if (!hasSameAs) {
      const fix: FixPlan = {
        ruleId: 'geo.knowledge.sameas',
        description: 'Missing sameAs references linking entities to the Knowledge Graph.',
        suggestedFix: 'Incorporate Wikidata, Wikipedia, or official social profile links in sameAs schema array.',
        targetFile: context.filePath
      };

      return {
        passed: false,
        confidence: 1.0,
        output: 'GEO check failed: Missing structured sameAs links mapping entities to official KG records.',
        source: 'geo-knowledge-validator',
        fixPlan: fix
      };
    }

    return {
      passed: true,
      confidence: 1.0,
      output: 'sameAs Knowledge Graph mapping references validated successfully.',
      source: 'geo-knowledge-validator'
    };
  }
};
