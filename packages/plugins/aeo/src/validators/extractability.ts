import { ExecutionPlan, VerificationEvidence, ValidatorPlugin, FixPlan } from '@seokit/core';
import * as cheerio from 'cheerio';

export const aeoExtractabilityValidator: ValidatorPlugin = {
  id: 'aeo-extractability-validator',
  version: '1.0.0',
  async execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence> {
    const html = context.rawHtml || context.pageHtml || '';
    if (!html) {
      return { passed: true, confidence: 1.0, output: 'No HTML available.', source: 'aeo-extractability-validator' };
    }

    const $ = cheerio.load(html);
    const bodyText = $('body').text().trim().replace(/\s+/g, ' ');
    const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

    if (wordCount < 200) {
      const fix: FixPlan = {
        ruleId: 'aeo.extractability.wordcount',
        description: 'Insufficient content size for answer engines.',
        suggestedFix: 'Expand content to at least 200 words under key topic headers.',
        targetFile: context.filePath
      };

      return {
        passed: false,
        confidence: 1.0,
        output: `AEO target: page word count is only ${wordCount} words (threshold: 200 words).`,
        source: 'aeo-extractability-validator',
        fixPlan: fix
      };
    }

    return {
      passed: true,
      confidence: 1.0,
      output: `Page word count verified (${wordCount} words).`,
      source: 'aeo-extractability-validator'
    };
  }
};
