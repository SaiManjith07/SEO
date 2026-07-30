import { ExecutionPlan, VerificationEvidence, ValidatorPlugin, FixPlan } from '@seokit/core';
import * as cheerio from 'cheerio';

export const aeoStructureValidator: ValidatorPlugin = {
  id: 'aeo-structure-validator',
  version: '1.0.0',
  async execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence> {
    const html = context.rawHtml || context.pageHtml || '';
    if (!html) {
      return { passed: true, confidence: 1.0, output: 'No HTML available.', source: 'aeo-structure-validator' };
    }

    const $ = cheerio.load(html);
    const bodyText = $('body').text().trim().replace(/\s+/g, ' ');
    const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

    // Check paragraph count/length
    const paragraphs = $('p');
    let tooLong = 0;
    paragraphs.each((_, el) => {
      const text = $(el).text().trim();
      const pWords = text.split(/\s+/).filter(Boolean).length;
      if (pWords > 120) tooLong++;
    });

    const issues: string[] = [];
    if (tooLong > 0) {
      issues.push(`${tooLong} paragraphs contain more than 120 words.`);
    }

    if (issues.length > 0) {
      const fix: FixPlan = {
        ruleId: 'aeo.content.structure',
        description: 'Vague paragraph boundaries or oversized text blocks.',
        suggestedFix: 'Decompose paragraphs exceeding 100 words into shorter, concise sections.',
        targetFile: context.filePath
      };

      return {
        passed: false,
        confidence: 1.0,
        output: `Content structure issues: ${issues.join('; ')}`,
        source: 'aeo-structure-validator',
        fixPlan: fix
      };
    }

    return {
      passed: true,
      confidence: 1.0,
      output: 'Paragraph boundaries and structure meet layout recommendations.',
      source: 'aeo-structure-validator'
    };
  }
};
