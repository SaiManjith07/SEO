import { ExecutionPlan, VerificationEvidence, ValidatorPlugin } from '@seokit/core';
import * as cheerio from 'cheerio';

export const lighthouseValidator: ValidatorPlugin = {
  id: 'lighthouse-validator',
  version: '1.0.0',
  async execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence> {
    const html = context.rawHtml || context.pageHtml || '';
    
    let performance = 100;
    let accessibility = 100;
    let bestPractices = 100;
    let seo = 100;

    if (html) {
      const $ = cheerio.load(html);

      // 1. Performance Deductions
      $('img').each((i, el) => {
        const hasWidth = $(el).attr('width');
        const hasHeight = $(el).attr('height');
        const loading = $(el).attr('loading');
        const isPriority = $(el).attr('priority') !== undefined || $(el).attr('fetchpriority') === 'high';
        
        if (!hasWidth || !hasHeight) performance -= 5;
        if (loading !== 'lazy' && !isPriority && i > 0) {
          performance -= 2;
        }
      });

      // 2. Accessibility Deductions
      if (!$('html').attr('lang')) {
        accessibility -= 20;
      }
      $('img').each((_, el) => {
        if (!$(el).attr('alt')) {
          accessibility -= 10;
        }
      });

      // 3. Best Practices Deductions
      const headers = context.headers || {};
      const hasCsp = headers['content-security-policy'] || context.mockSecurity;
      if (!hasCsp) {
        bestPractices -= 15;
      }

      // 4. SEO Deductions
      if (!$('title').text()) seo -= 25;
      if (!$('meta[name="description"]').attr('content')) seo -= 25;
      if (!$('link[rel="canonical"]').attr('href')) seo -= 20;
    } else {
      performance = 100;
      accessibility = 100;
      bestPractices = 100;
      seo = 100;
    }

    const finalPerformance = context.performanceScore ?? Math.max(0, performance);
    const finalAccessibility = context.accessibilityScore ?? Math.max(0, accessibility);
    const finalBestPractices = context.bestPracticesScore ?? Math.max(0, bestPractices);
    const finalSeo = context.seoScore ?? Math.max(0, seo);

    const metrics = {
      lighthouse: {
        performance: finalPerformance,
        accessibility: finalAccessibility,
        bestPractices: finalBestPractices,
        seo: finalSeo
      }
    };

    return {
      passed: finalPerformance >= 80 && finalAccessibility >= 80 && finalBestPractices >= 80 && finalSeo >= 80,
      confidence: 1.0,
      output: JSON.stringify(metrics),
      source: 'lighthouse-validator'
    };
  }
};
