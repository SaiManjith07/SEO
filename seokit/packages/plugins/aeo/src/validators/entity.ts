import { ExecutionPlan, VerificationEvidence, ValidatorPlugin, FixPlan, calculateEntityDensity } from '@seokit/core';
import * as cheerio from 'cheerio';

export const aeoEntityValidator: ValidatorPlugin = {
  id: 'aeo-entity-validator',
  version: '1.0.0',
  async execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence> {
    const html = context.rawHtml || context.pageHtml || '';
    if (!html) {
      return { passed: true, confidence: 1.0, output: 'No HTML available.', source: 'aeo-entity-validator' };
    }

    const $ = cheerio.load(html);
    const text = $('body').text();
    const result = calculateEntityDensity(text);

    if (result.densityScore < 70) {
      const fix: FixPlan = {
        ruleId: 'aeo.entity.density',
        description: 'Vague text references: pronouns outnumber unique key entities.',
        suggestedFix: 'Replace ambiguous pronoun keywords ("it", "they", "them") with concrete entities.',
        targetFile: context.filePath
      };

      return {
        passed: false,
        confidence: 1.0,
        output: `Entity density is weak (density score: ${result.densityScore}, ratio: ${result.ratio}).`,
        source: 'aeo-entity-validator',
        fixPlan: fix
      };
    }

    return {
      passed: true,
      confidence: 1.0,
      output: `Entity density verified successfully (score: ${result.densityScore}, ratio: ${result.ratio}).`,
      source: 'aeo-entity-validator'
    };
  }
};
