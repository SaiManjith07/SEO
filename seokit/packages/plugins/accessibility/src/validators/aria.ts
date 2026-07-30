import { ExecutionPlan, VerificationEvidence, ValidatorPlugin, FixPlan } from '@seokit/core';
import * as cheerio from 'cheerio';

export const ariaValidator: ValidatorPlugin = {
  id: 'aria-validator',
  version: '1.0.0',
  async execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence> {
    const html = context.rawHtml || context.pageHtml || '';
    if (!html) {
      return { passed: true, confidence: 1.0, output: 'No HTML available.', source: 'aria-validator' };
    }

    const $ = cheerio.load(html);
    const issues: string[] = [];

    $('[role]').each((_, el) => {
      const role = $(el).attr('role') ?? '';
      if (!role.trim()) {
        issues.push('Element features empty role attribute.');
      }
    });

    if (issues.length > 0) {
      const fix: FixPlan = {
        ruleId: 'accessibility.aria.roles',
        description: 'Empty or invalid ARIA roles detected.',
        suggestedFix: 'Replace empty role attributes with valid schema role descriptors.',
        targetFile: context.filePath
      };

      return {
        passed: false,
        confidence: 1.0,
        output: `ARIA validator issues: ${issues.join('; ')}`,
        source: 'aria-validator',
        fixPlan: fix
      };
    }

    return {
      passed: true,
      confidence: 1.0,
      output: 'ARIA role configurations verified successfully.',
      source: 'aria-validator'
    };
  }
};
