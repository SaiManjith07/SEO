import { describe, it, expect } from 'vitest';
import { Website } from '@seokit/website';
import { RawResource } from '@seokit/parser';
import { FrameworkDetector } from './detector.js';

describe('FrameworkDetector Verification', () => {
  it('should detect Next.js framework correctly', () => {
    const website: Website = {
      pages: {
        '/': {
          route: '/',
          rawHtml: '<html><head><meta name="next-head-count" content="10"></head><body><div id="__next">Hello Next.js</div></body></html>',
          headers: {}
        }
      },
      robotsTxt: '',
      sitemapXml: ''
    };
    const rawResources: RawResource[] = [
      {
        route: '/',
        sourcePath: '/index.html',
        content: '<html><head><meta name="next-head-count" content="10"></head><body><div id="__next">Hello Next.js</div></body></html>',
        headers: {},
        acquiredAt: new Date().toISOString()
      }
    ];

    const result = FrameworkDetector.detect(website, rawResources);
    expect(result.framework).toBe('Next.js');
    expect(result.renderingMode).toBe('Hybrid');
    expect(result.confidence).toBeGreaterThanOrEqual(90);
  });

  it('should detect Astro framework correctly', () => {
    const website: Website = {
      pages: {
        '/': {
          route: '/',
          rawHtml: '<html><head><meta name="generator" content="Astro v4.0.0"></head><body><div class="astro-xyz">Hello Astro</div></body></html>',
          headers: {}
        }
      },
      robotsTxt: '',
      sitemapXml: ''
    };
    const rawResources: RawResource[] = [
      {
        route: '/',
        sourcePath: '/index.html',
        content: '<html><head><meta name="generator" content="Astro v4.0.0"></head><body><div class="astro-xyz">Hello Astro</div></body></html>',
        headers: {},
        acquiredAt: new Date().toISOString()
      }
    ];

    const result = FrameworkDetector.detect(website, rawResources);
    expect(result.framework).toBe('Astro');
    expect(result.renderingMode).toBe('SSG');
    expect(result.confidence).toBeGreaterThanOrEqual(90);
  });

  it('should detect Angular framework correctly', () => {
    const website: Website = {
      pages: {
        '/': {
          route: '/',
          rawHtml: '<html><body><app-root></app-root></body></html>',
          headers: {}
        }
      },
      robotsTxt: '',
      sitemapXml: ''
    };
    const rawResources: RawResource[] = [
      {
        route: '/',
        sourcePath: '/index.html',
        content: '<html><body><app-root></app-root></body></html>',
        headers: {},
        acquiredAt: new Date().toISOString()
      }
    ];

    const result = FrameworkDetector.detect(website, rawResources);
    expect(result.framework).toBe('Angular');
    expect(result.renderingMode).toBe('CSR');
    expect(result.confidence).toBeGreaterThanOrEqual(80);
  });

  it('should detect Static HTML default fallback correctly', () => {
    const website: Website = {
      pages: {
        '/': {
          route: '/',
          rawHtml: '<html><body>Plain static content</body></html>',
          headers: {}
        }
      },
      robotsTxt: '',
      sitemapXml: ''
    };
    const rawResources: RawResource[] = [
      {
        route: '/',
        sourcePath: '/index.html',
        content: '<html><body>Plain static content</body></html>',
        headers: {},
        acquiredAt: new Date().toISOString()
      }
    ];

    const result = FrameworkDetector.detect(website, rawResources);
    expect(result.framework).toBe('Static HTML');
    expect(result.renderingMode).toBe('Static');
    expect(result.confidence).toBe(100);
  });
});
