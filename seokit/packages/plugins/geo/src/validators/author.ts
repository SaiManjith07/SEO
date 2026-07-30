import { ExecutionPlan, VerificationEvidence, ValidatorPlugin, FixPlan } from '@seokit/core';
import * as cheerio from 'cheerio';

export const geoAuthorValidator: ValidatorPlugin = {
  id: 'geo-author-validator',
  version: '1.0.0',
  async execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence> {
    const html = context.rawHtml || context.pageHtml || '';
    if (!html) {
      return { passed: true, confidence: 1.0, output: 'No HTML available.', source: 'geo-author-validator' };
    }

    const $ = cheerio.load(html);
    const metaAuthor = $('meta[name="author"]').attr('content') ?? '';
    
    let hasAuthorSchema = false;
    const scripts = $('script[type="application/ld+json"]');
    scripts.each((_, el) => {
      try {
        const data = JSON.parse($(el).html() ?? '');
        if (data.author || data.creator) {
          hasAuthorSchema = true;
        }
      } catch {
        // ignore
      }
    });

    if (!metaAuthor && !hasAuthorSchema) {
      const fix: FixPlan = {
        ruleId: 'geo.author.attribution',
        description: 'Missing explicit author attribution metadata.',
        suggestedFix: 'Incorporate an <meta name="author" content="name"> head tag or include an "author" field in page schema.',
        targetFile: context.filePath
      };

      return {
        passed: false,
        confidence: 1.0,
        output: 'GEO check failed: Page is missing explicit author attribution signals.',
        source: 'geo-author-validator',
        fixPlan: fix
      };
    }

    return {
      passed: true,
      confidence: 1.0,
      output: 'Author attribution meta or schema signals verified.',
      source: 'geo-author-validator'
    };
  }
};
