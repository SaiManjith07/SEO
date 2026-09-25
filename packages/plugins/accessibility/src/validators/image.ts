import { ExecutionPlan, VerificationEvidence, ValidatorPlugin, FixPlan } from '@seokit/core';
import * as cheerio from 'cheerio';

export const imageAltValidator: ValidatorPlugin = {
  id: 'image-alt-validator',
  version: '1.0.0',
  async execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence> {
    const html = context.rawHtml || context.pageHtml || '';
    if (!html) {
      return { passed: true, confidence: 1.0, output: 'No HTML available.', source: 'image-alt-validator' };
    }

    const $ = cheerio.load(html);
    const images = $('img');
    const issues: string[] = [];

    images.each((_, el) => {
      const alt = $(el).attr('alt');
      const src = $(el).attr('src') ?? '';

      if (alt === undefined) {
        issues.push(`Image tag "${src}" is missing the alt attribute.`);
      }
    });

    if (issues.length > 0) {
      const fix: FixPlan = {
        ruleId: 'accessibility.images.alt',
        description: 'Image elements are missing explicit alt attributes.',
        suggestedFix: 'Incorporate alternative text description tags or empty alt tags for decoration.',
        targetFile: context.filePath
      };

      return {
        passed: false,
        confidence: 1.0,
        output: `Image alt issues: ${issues.join('; ')}`,
        source: 'image-alt-validator',
        fixPlan: fix
      };
    }

    return {
      passed: true,
      confidence: 1.0,
      output: 'Image elements feature valid alternative text attributes.',
      source: 'image-alt-validator'
    };
  }
};
