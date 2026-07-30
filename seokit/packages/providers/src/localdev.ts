import { RawResource } from '@seokit/parser';
import { crawlSite } from '@seokit/core';
import { WebsiteProvider } from './base.js';
import { ProviderCapabilities } from './types.js';

export class LocalDevProvider extends WebsiteProvider {
  public getCapabilities(): ProviderCapabilities {
    return {
      supportsJavaScript: false,
      supportsHeaders: true,
      supportsAssets: true,
      supportsPerformance: true,
      supportsAuthentication: false
    };
  }

  public async canVerify(): Promise<boolean> {
    try {
      const url = new URL(this.target);
      const isHttp = url.protocol === 'http:' || url.protocol === 'https:';
      const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
      return isHttp && isLocalhost;
    } catch {
      return false;
    }
  }

  public async initialize(): Promise<void> {
    // No setup steps needed for localhost URLs
  }

  public async acquireRawResources(): Promise<RawResource[]> {
    const resources: RawResource[] = [];
    try {
      const siteContext = await crawlSite(this.target, this.options.maxPages || 10, false);

      // Add robots.txt resource if found
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

      // Add page resources
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
            content: page.rawHtml,
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
