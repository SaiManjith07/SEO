import { defineRule } from '../engine.js';
import type { Finding, PageContext } from '../types.js';
import * as cheerio from 'cheerio';

/**
 * Checks that all image tags have explicit width and height to prevent CLS.
 */
export const imageDimensions = defineRule<PageContext>({
  id: 'performance/image-dimensions',
  category: 'performance',
  severity: 'warning',
  needs: 'page',
  description: 'Ensures every <img> tag has explicit width and height attributes to prevent Cumulative Layout Shift (CLS).',
  check(ctx) {
    const findings: Finding[] = [];
    const $ = cheerio.load(ctx.rawHtml);

    $('img').each((_, el) => {
      const src = $(el).attr('src') || 'unknown';
      const width = $(el).attr('width');
      const height = $(el).attr('height');

      // Ignore tracking pixels (1x1) or SVG data URIs if they are obviously tiny,
      // but as a general rule, all images should have explicit dimensions.
      if (!width || !height) {
        findings.push({
          ruleId: 'performance/image-dimensions',
          severity: 'warning',
          message: `Image missing explicit dimensions: "${src}".`,
          fix: 'Add explicit width and height attributes to the <img> tag to reserve space and prevent layout shifts.',
          location: { url: ctx.url },
          evidence: { src }
        });
      }
    });

    return findings;
  }
});

/**
 * Checks lazy loading logic:
 * - Images below the fold should be lazy loaded.
 * - The first hero image should NOT be lazy loaded.
 */
export const imageLazyLoading = defineRule<PageContext>({
  id: 'performance/lazy-loading',
  category: 'performance',
  severity: 'warning',
  needs: 'page',
  description: 'Validates optimal usage of the loading="lazy" attribute on images.',
  check(ctx) {
    const findings: Finding[] = [];
    const $ = cheerio.load(ctx.rawHtml);

    let imageIndex = 0;
    $('img').each((_, el) => {
      const src = $(el).attr('src') || 'unknown';
      const loading = $(el).attr('loading');
      
      if (imageIndex === 0) {
        // Hero image (first image) should typically not be lazy loaded
        if (loading === 'lazy') {
          findings.push({
            ruleId: 'performance/lazy-loading',
            severity: 'warning',
            message: `Hero image uses lazy loading: "${src}".`,
            fix: 'Remove loading="lazy" or change to loading="eager" for above-the-fold images to improve LCP.',
            location: { url: ctx.url },
            evidence: { src }
          });
        }
      } else if (imageIndex > 2) {
        // Images likely below the fold should be lazy loaded
        if (loading !== 'lazy') {
          findings.push({
            ruleId: 'performance/lazy-loading',
            severity: 'info', // Info severity as we cannot guarantee it is below the fold statically
            message: `Image potentially below the fold is not lazy loaded: "${src}".`,
            fix: 'Add loading="lazy" to defer loading of offscreen images.',
            location: { url: ctx.url },
            evidence: { src }
          });
        }
      }
      imageIndex++;
    });

    return findings;
  }
});
