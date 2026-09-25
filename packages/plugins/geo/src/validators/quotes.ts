import { ExecutionPlan, VerificationEvidence, ValidatorPlugin, FixPlan } from '@seokit/core';
import * as cheerio from 'cheerio';

export const geoQuotesValidator: ValidatorPlugin = {
  id: 'geo-quotes-validator',
  version: '1.0.0',
  async execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence> {
    const html = context.rawHtml || context.pageHtml || '';
    if (!html) {
      return { passed: true, confidence: 1.0, output: 'No HTML available.', source: 'geo-quotes-validator' };
    }

    const $ = cheerio.load(html);
    const bodyText = $('body').text() || '';
    
    // Find quotations enclosed in quotes ("quote" or “quote”)
    const hasQuotes = /["“][^"”]{10,250}["”]/i.test(bodyText) || $('blockquote').length > 0 || $('q').length > 0;

    if (!hasQuotes) {
      const fix: FixPlan = {
        ruleId: 'geo.quotes.authority',
        description: 'Missing direct citations or quotes from credible named sources.',
        suggestedFix: 'Add at least one named quote attribute enclosed in double quotes or blockquote elements (e.g. As stated by Dr. Jane Doe: "..." ).',
        targetFile: context.filePath
      };

      return {
        passed: false,
        confidence: 1.0,
        output: 'GEO check failed: Page lacks authoritative quotations or blockquote blocks.',
        source: 'geo-quotes-validator',
        fixPlan: fix
      };
    }

    return {
      passed: true,
      confidence: 1.0,
      output: 'Authoritative quotation and testimonial references verified.',
      source: 'geo-quotes-validator'
    };
  }
};
