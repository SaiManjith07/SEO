import { describe, it, expect } from 'vitest';
import { runRules } from '../engine.js';
import { imageDimensions, imageLazyLoading } from './performance.js';
import { registerRule, unregisterRule } from '../engine.js';
import type { PageContext } from '../types.js';

function page(html: string): PageContext {
  return {
    kind: 'page',
    url: 'https://example.com/test',
    status: 200,
    headers: {},
    rawHtml: html,
  };
}

describe('Performance Rules', () => {
  describe('imageDimensions', () => {
    it('flags images without dimensions', () => {
      const findings = imageDimensions.check(
        page('<html><body><img src="test.jpg" /></body></html>')
      );
      expect(findings).toHaveLength(1);
      expect(findings[0].message).toMatch(/missing explicit dimensions/);
    });

    it('passes images with width and height', () => {
      const findings = imageDimensions.check(
        page('<html><body><img src="test.jpg" width="100" height="100" /></body></html>')
      );
      expect(findings).toHaveLength(0);
    });
  });

  describe('imageLazyLoading', () => {
    it('flags hero image if it uses lazy loading', () => {
      const findings = imageLazyLoading.check(
        page('<html><body><img src="hero.jpg" loading="lazy" /></body></html>')
      );
      expect(findings).toHaveLength(1);
      expect(findings[0].message).toMatch(/Hero image uses lazy loading/);
    });

    it('passes hero image if it is eager or has no loading attribute', () => {
      const findings = imageLazyLoading.check(
        page('<html><body><img src="hero.jpg" loading="eager" /></body></html>')
      );
      expect(findings).toHaveLength(0);
    });

    it('flags images below the fold without lazy loading', () => {
      const html = `
        <html><body>
          <img src="hero.jpg" />
          <img src="2.jpg" />
          <img src="3.jpg" />
          <img src="4.jpg" />
        </body></html>
      `;
      const findings = imageLazyLoading.check(page(html));
      expect(findings).toHaveLength(1);
      expect(findings[0].message).toMatch(/potentially below the fold is not lazy loaded/);
    });
  });
});
