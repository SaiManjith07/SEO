import { ExecutionPlan, VerificationEvidence, ValidatorPlugin, FixPlan } from '@seokit/core';
import * as cheerio from 'cheerio';

export const geoStatisticsValidator: ValidatorPlugin = {
  id: 'geo-statistics-validator',
  version: '1.0.0',
  async execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence> {
    const html = context.rawHtml || context.pageHtml || '';
    if (!html) {
      return { passed: true, confidence: 1.0, output: 'No HTML available.', source: 'geo-statistics-validator' };
    }

    const $ = cheerio.load(html);
    const bodyText = $('body').text() || '';
    
    // Find numbers (digits, percentages, fractions, years)
    const numberMatches = bodyText.match(/\b\d+(?:[\.,]\d+)?%?\b/g) || [];
    const distinctNumbers = new Set(numberMatches);

    // Princeton GEO benchmark requirement: at least 3 distinct statistics/numerical claims to increase LLM confidence.
    if (distinctNumbers.size < 3) {
      const fix: FixPlan = {
        ruleId: 'geo.statistics.density',
        description: 'Vague qualitative claims lack numeric data, resulting in lower retrieval confidence.',
        suggestedFix: 'Incorporate at least 3 distinct numerical statistics or data percentages (e.g., "+25.9% lift") into the body content.',
        targetFile: context.filePath
      };

      return {
        passed: false,
        confidence: 1.0,
        output: `GEO check failed: Low statistics density (found ${distinctNumbers.size} numeric claims; minimum 3 required).`,
        source: 'geo-statistics-validator',
        fixPlan: fix
      };
    }

    return {
      passed: true,
      confidence: 1.0,
      output: `Statistics density validated successfully (found ${distinctNumbers.size} numerical claims).`,
      source: 'geo-statistics-validator'
    };
  }
};
