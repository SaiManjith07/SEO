import { ExecutionPlan, VerificationEvidence, ValidatorPlugin } from '@seokit/core';
import * as cheerio from 'cheerio';

export const imageValidator: ValidatorPlugin = {
  id: 'image-validator',
  version: '1.0.0',
  async execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence> {
    const html = context.rawHtml || context.pageHtml || '';
    if (!html) {
      return {
        passed: true,
        confidence: 1.0,
        output: 'No HTML available for image optimization check.',
        source: 'image-validator'
      };
    }

    const $ = cheerio.load(html);
    const images = $('img');
    const issues: string[] = [];

    images.each((i, el) => {
      const src = $(el).attr('src') ?? '';
      const hasWidth = $(el).attr('width');
      const hasHeight = $(el).attr('height');
      const loading = $(el).attr('loading');
      
      const fileExt = src.split('.').pop()?.toLowerCase();
      const isModern = fileExt === 'webp' || fileExt === 'avif' || fileExt === 'svg';

      if (!hasWidth || !hasHeight) {
        issues.push(`Image "${src}" is missing explicit width or height attributes.`);
      }
      if (loading !== 'lazy' && i > 2) {
        issues.push(`Image "${src}" should be lazy-loaded.`);
      }
      if (!isModern && src && !src.startsWith('data:')) {
        issues.push(`Image "${src}" is not in modern WebP/AVIF format.`);
      }
    });

    return {
      passed: issues.length === 0,
      confidence: 1.0,
      output: issues.length === 0 
        ? 'All images are properly sized, lazy-loaded, and use modern formats.'
        : `Image optimization recommendations: ${issues.join('; ')}`,
      source: 'image-validator'
    };
  }
};
