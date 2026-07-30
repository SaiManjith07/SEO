import { Website, Page, Asset, FrameworkMetadata } from './types.js';

export class WebsiteBuilder {
  private origin: string;
  private pages: Record<string, Page> = {};
  private assets: Record<string, Asset> = {};
  private sitemapXml?: string;
  private robotsTxt?: string;
  private frameworkMetadata?: FrameworkMetadata;

  constructor(origin: string) {
    this.origin = origin;
  }

  public setRobotsTxt(content: string): this {
    this.robotsTxt = content;
    return this;
  }

  public setSitemapXml(content: string): this {
    this.sitemapXml = content;
    return this;
  }

  public setFrameworkMetadata(metadata: FrameworkMetadata): this {
    this.frameworkMetadata = metadata;
    return this;
  }

  public addPage(page: Page): this {
    this.pages[page.route] = page;
    return this;
  }

  public addAsset(route: string, asset: Asset): this {
    this.assets[route] = asset;
    return this;
  }

  public build(): Website {
    return {
      origin: this.origin,
      pages: { ...this.pages },
      assets: { ...this.assets },
      robotsTxt: this.robotsTxt,
      sitemapXml: this.sitemapXml,
      frameworkMetadata: this.frameworkMetadata ? { ...this.frameworkMetadata } : undefined
    };
  }
}
