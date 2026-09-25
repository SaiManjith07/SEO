import { RawResource } from '@seokit/parser';
import { crawlSite } from '@seokit/core';
import { WebsiteProvider } from './base.js';
import { ProviderCapabilities } from './types.js';

export class BrowserProvider extends WebsiteProvider {
  public getCapabilities(): ProviderCapabilities {
    return {
      supportsJavaScript: true,
      supportsHeaders: true,
      supportsAssets: true,
      supportsPerformance: true,
      supportsAuthentication: false
    };
  }

  public async canVerify(): Promise<boolean> {
    try {
      // Browser provider matches HTTP/HTTPS targets when JavaScript rendering is requested
      const url = new URL(this.target);
      const isHttp = url.protocol === 'http:' || url.protocol === 'https:';
      const requestRender = this.options.render === true;
      return isHttp && requestRender;
    } catch {
      return false;
    }
  }

  public async initialize(): Promise<void> {
    // No setup steps needed
  }

  public async acquireRawResources(): Promise<RawResource[]> {
    const resources: RawResource[] = [];
    try {
      // Invoke core crawler with JavaScript rendering set to true
      const siteContext = await crawlSite(this.target, this.options.maxPages || 10, true);

      // Add robots.txt resource
      if (siteContext.robotsTxt) {
        resources.push({
          route: '/robots.txt',
          sourcePath: `${this.target}/robots.txt`,
          content: siteContext.robotsTxt,
          headers: {},
          acquiredAt: new Date().toISOString()
        });
      }

      // Add sitemaps
      for (const sitemapUrl of siteContext.sitemapUrls) {
        try {
          const res = await fetch(sitemapUrl);
          if (res.ok) {
            const content = await res.text();
            resources.push({
              route: '/sitemap.xml',
              sourcePath: sitemapUrl,
              content,
              headers: {},
              acquiredAt: new Date().toISOString()
            });
          }
        } catch {
          // Skip unreachable sitemaps
        }
      }

      // Add pages (using rendered HTML output from Playwright hydration)
      for (const page of siteContext.pages) {
        try {
          const pageUrl = new URL(page.url);
          let route = pageUrl.pathname;
          if (route === '') {
            route = '/';
          }

          resources.push({
            route,
            sourcePath: page.url,
            // Prefer the Playwright rendered HTML payload
            content: page.renderedHtml || page.rawHtml,
            headers: page.headers || {},
            acquiredAt: new Date().toISOString()
          });
        } catch {
          // Skip malformed page URLs
        }
      }
    } catch {
      // Return empty on crawl failure
    }

    return resources;
  }

  public async shutdown(): Promise<void> {
    // No teardown steps needed
  }
}
