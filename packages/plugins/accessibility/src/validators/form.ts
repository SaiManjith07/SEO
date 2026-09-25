import { ExecutionPlan, VerificationEvidence, ValidatorPlugin, FixPlan } from '@seokit/core';
import * as cheerio from 'cheerio';

export const formLabelsValidator: ValidatorPlugin = {
  id: 'form-labels-validator',
  version: '1.0.0',
  async execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence> {
    const html = context.rawHtml || context.pageHtml || '';
    if (!html) {
      return { passed: true, confidence: 1.0, output: 'No HTML available.', source: 'form-labels-validator' };
    }

    const $ = cheerio.load(html);
    const inputs = $('input, select, textarea');
    const issues: string[] = [];

    inputs.each((_, el) => {
      const type = $(el).attr('type');
      if (type === 'submit' || type === 'hidden' || type === 'button') return;

      const id = $(el).attr('id');
      const ariaLabel = $(el).attr('aria-label');
      const ariaLabelledBy = $(el).attr('aria-labelledby');

      let hasLabel = false;
      if (id) {
        hasLabel = $(`label[for="${id}"]`).length > 0;
      }
      if (ariaLabel || ariaLabelledBy) {
        hasLabel = true;
      }

      if (!hasLabel) {
        issues.push(`Input element (id: "${id || 'none'}") is missing an associated label.`);
      }
    });

    if (issues.length > 0) {
      const fix: FixPlan = {
        ruleId: 'accessibility.form.labels',
        description: 'Form input elements are missing accessible labels.',
        suggestedFix: 'Incorporate label tags matching element IDs or append aria-label tags.',
        targetFile: context.filePath
      };

      return {
        passed: false,
        confidence: 1.0,
        output: `Form label issues: ${issues.join('; ')}`,
        source: 'form-labels-validator',
        fixPlan: fix
      };
    }

    return {
      passed: true,
      confidence: 1.0,
      output: 'Form inputs possess valid matching labels.',
      source: 'form-labels-validator'
    };
  }
};
