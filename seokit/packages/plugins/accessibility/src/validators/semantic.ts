import { ExecutionPlan, VerificationEvidence, ValidatorPlugin, FixPlan } from '@seokit/core';
import * as cheerio from 'cheerio';

export const semanticValidator: ValidatorPlugin = {
  id: 'semantic-validator',
  version: '1.0.0',
  async execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence> {
    const html = context.rawHtml || context.pageHtml || '';
    if (!html) {
      return { passed: true, confidence: 1.0, output: 'No HTML available.', source: 'semantic-validator' };
    }

    const $ = cheerio.load(html);
    const hasHeader = $('header').length > 0;
    const hasMain = $('main').length > 0;
    const hasFooter = $('footer').length > 0;

    const missing: string[] = [];
    if (!hasHeader) missing.push('<header>');
    if (!hasMain) missing.push('<main>');
    if (!hasFooter) missing.push('<footer>');

    if (missing.length > 0) {
      const fix: FixPlan = {
        ruleId: 'accessibility.semantic.structure',
        description: 'Page is missing semantic block elements.',
        suggestedFix: `Incorporate structural elements: ${missing.join(', ')}.`,
        targetFile: context.filePath
      };

      return {
        passed: false,
        confidence: 1.0,
        output: `Missing semantic structural HTML elements: ${missing.join(', ')}.`,
        source: 'semantic-validator',
        fixPlan: fix
      };
    }

    return {
      passed: true,
      confidence: 1.0,
      output: 'Page contains valid semantic block structural containers.',
      source: 'semantic-validator'
    };
  }
};
