import { ExecutionPlan, VerificationEvidence, ValidatorPlugin, FixPlan } from '@seokit/core';
import * as cheerio from 'cheerio';

export const wcagValidator: ValidatorPlugin = {
  id: 'wcag-validator',
  version: '1.0.0',
  async execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence> {
    const html = context.rawHtml || context.pageHtml || '';
    if (!html) {
      return { passed: true, confidence: 1.0, output: 'No HTML available.', source: 'wcag-validator' };
    }

    const $ = cheerio.load(html);
    const lang = $('html').attr('lang') ?? '';

    if (!lang) {
      const fix: FixPlan = {
        ruleId: 'accessibility.wcag.lang',
        description: 'Missing lang attribute on html element.',
        suggestedFix: 'Add lang="en" to the html tag.',
        targetFile: context.filePath
      };

      return {
        passed: false,
        confidence: 1.0,
        output: 'WCAG violation: The html tag must declare a lang attribute.',
        source: 'wcag-validator',
        fixPlan: fix
      };
    }

    return {
      passed: true,
      confidence: 1.0,
      output: `HTML lang attribute verified: "${lang}".`,
      source: 'wcag-validator'
    };
  }
};
