import { ExecutionPlan, VerificationEvidence, ValidatorPlugin, FixPlan } from '@seokit/core';
import * as cheerio from 'cheerio';

export const headingHierarchyValidator: ValidatorPlugin = {
  id: 'heading-hierarchy-validator',
  version: '1.0.0',
  async execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence> {
    const html = context.rawHtml || context.pageHtml || '';
    if (!html) {
      return { passed: true, confidence: 1.0, output: 'No HTML available.', source: 'heading-hierarchy-validator' };
    }

    const $ = cheerio.load(html);
    const h1Count = $('h1').length;
    const issues: string[] = [];

    if (h1Count === 0) {
      issues.push('Missing H1 header tag');
    } else if (h1Count > 1) {
      issues.push(`Multiple (${h1Count}) H1 heading tags found.`);
    }

    // Check hierarchy sequence
    let prevLevel = 0;
    $(':header').each((_, el) => {
      const level = parseInt(el.tagName.substring(1), 10);
      if (prevLevel > 0 && level - prevLevel > 1) {
        issues.push(`Skipped heading level: <${el.tagName}> directly followed <h${prevLevel}>.`);
      }
      prevLevel = level;
    });

    if (issues.length > 0) {
      const fix: FixPlan = {
        ruleId: 'accessibility.heading.hierarchy',
        description: 'Skipped levels or invalid heading structure.',
        suggestedFix: 'Re-align page headings sequentially: h1 -> h2 -> h3.',
        targetFile: context.filePath
      };

      return {
        passed: false,
        confidence: 1.0,
        output: `Heading hierarchy issues: ${issues.join('; ')}`,
        source: 'heading-hierarchy-validator',
        fixPlan: fix
      };
    }

    return {
      passed: true,
      confidence: 1.0,
      output: 'Heading element flow conforms to strict semantic hierarchy requirements.',
      source: 'heading-hierarchy-validator'
    };
  }
};
