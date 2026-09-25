import { ExecutionPlan, VerificationEvidence, ValidatorPlugin, FixPlan } from '@seokit/core';
import * as cheerio from 'cheerio';

export const geoCitationValidator: ValidatorPlugin = {
  id: 'geo-citation-validator',
  version: '1.0.0',
  async execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence> {
    const html = context.rawHtml || context.pageHtml || '';
    if (!html) {
      return { passed: true, confidence: 1.0, output: 'No HTML available.', source: 'geo-citation-validator' };
    }

    const $ = cheerio.load(html);
    const links = $('a[href]');
    let externalLinkCount = 0;

    links.each((_, el) => {
      const href = $(el).attr('href') ?? '';
      if (href.startsWith('http://') || href.startsWith('https://')) {
        externalLinkCount++;
      }
    });

    if (externalLinkCount === 0) {
      const fix: FixPlan = {
        ruleId: 'geo.citation.markup',
        description: 'Missing authoritative external links or citation sources.',
        suggestedFix: 'Incorporate external hyperlinks referencing reputable primary sources.',
        targetFile: context.filePath
      };

      return {
        passed: false,
        confidence: 1.0,
        output: 'GEO check failed: Missing outbound citation hyperlinks.',
        source: 'geo-citation-validator',
        fixPlan: fix
      };
    }

    return {
      passed: true,
      confidence: 1.0,
      output: `Outbound citations verified successfully (found ${externalLinkCount} external sources).`,
      source: 'geo-citation-validator'
    };
  }
};
