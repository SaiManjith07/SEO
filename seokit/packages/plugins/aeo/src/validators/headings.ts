import { ExecutionPlan, VerificationEvidence, ValidatorPlugin, FixPlan } from '@seokit/core';
import * as cheerio from 'cheerio';

export const aeoHeadingsValidator: ValidatorPlugin = {
  id: 'aeo-headings-validator',
  version: '1.0.0',
  async execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence> {
    const html = context.rawHtml || context.pageHtml || '';
    if (!html) {
      return { passed: true, confidence: 1.0, output: 'No HTML available.', source: 'aeo-headings-validator' };
    }

    const $ = cheerio.load(html);
    const headings: string[] = [];
    $(':header').each((_, el) => {
      headings.push($(el).text().trim());
    });

    const questions = headings.filter(h =>
      h.endsWith('?') ||
      /^(how|what|why|when|where|which|who|can|should|is|are|does|do)\b/i.test(h)
    );

    if (headings.length > 0 && questions.length === 0) {
      const fix: FixPlan = {
        ruleId: 'aeo.headings.questions',
        description: 'No question-shaped headings are present.',
        suggestedFix: 'Rephrase subheadings to match natural query structures (e.g. "What is X?").',
        targetFile: context.filePath
      };

      return {
        passed: false,
        confidence: 1.0,
        output: 'Answer Engine target: headings should align directly with user query terms.',
        source: 'aeo-headings-validator',
        fixPlan: fix
      };
    }

    return {
      passed: true,
      confidence: 1.0,
      output: `Heading optimization passed. Found ${questions.length} question-shaped subheadings.`,
      source: 'aeo-headings-validator'
    };
  }
};
