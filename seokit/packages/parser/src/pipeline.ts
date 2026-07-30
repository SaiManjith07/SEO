import * as cheerio from 'cheerio';
import { Website, Page, PageMetadata, MetadataField, SourceLocation } from '@seokit/website';
import { WebsiteBuilder } from '@seokit/website';
import { IParserPipeline, RawResource, ParserOptions } from './interfaces.js';

export class ParserPipeline implements IParserPipeline {
  public async parse(resources: RawResource[], options: ParserOptions = {}): Promise<Website> {
    // Detect origin default fallback
    const builder = new WebsiteBuilder('https://example.com');

    for (const res of resources) {
      if (res.route.endsWith('robots.txt')) {
        builder.setRobotsTxt(res.content.toString());
      } else if (res.route.endsWith('sitemap.xml')) {
        builder.setSitemapXml(res.content.toString());
      } else if (res.route.endsWith('.html') || res.route === '/' || res.route.endsWith('/')) {
        const html = res.content.toString();
        const $ = cheerio.load(html);

        const pageMetadata: PageMetadata = {
          headings: { h1: [], h2: [], h3: [] },
          outboundLinks: [],
          metaTags: {}
        };

        // Helper to locate source lines
        const locate = (searchSnippet: string): SourceLocation | undefined => {
          if (!searchSnippet) return undefined;
          const lines = html.split('\n');
          for (let i = 0; i < lines.length; i++) {
            const idx = lines[i].indexOf(searchSnippet);
            if (idx >= 0) {
              return {
                line: i + 1,
                columnStart: idx + 1,
                columnEnd: idx + searchSnippet.length + 1,
                snippet: lines[i].trim()
              };
            }
          }
          return undefined;
        };

        const titleText = $('title').text().trim();
        if (titleText) {
          pageMetadata.title = {
            value: titleText,
            location: locate(`<title>`) || locate(titleText)
          };
        }

        const descText = $('meta[name="description"]').attr('content')?.trim();
        if (descText) {
          pageMetadata.description = {
            value: descText,
            location: locate('name="description"') || locate(descText)
          };
        }

        const canonicalText = $('link[rel="canonical"]').attr('href')?.trim();
        if (canonicalText) {
          pageMetadata.canonicalUrl = {
            value: canonicalText,
            location: locate('rel="canonical"') || locate(canonicalText)
          };
        }

        const langText = $('html').attr('lang')?.trim();
        if (langText) {
          pageMetadata.lang = {
            value: langText,
            location: locate('lang=')
          };
        }

        // Headings
        $('h1').each((_, el) => {
          const txt = $(el).text().trim();
          pageMetadata.headings.h1.push({
            value: txt,
            location: locate(txt)
          });
        });

        $('h2').each((_, el) => {
          const txt = $(el).text().trim();
          pageMetadata.headings.h2.push({
            value: txt,
            location: locate(txt)
          });
        });

        $('h3').each((_, el) => {
          const txt = $(el).text().trim();
          pageMetadata.headings.h3.push({
            value: txt,
            location: locate(txt)
          });
        });

        // Outbound links
        $('a[href]').each((_, el) => {
          const href = $(el).attr('href')?.trim();
          if (href) {
            pageMetadata.outboundLinks.push({
              value: href,
              location: locate(href)
            });
          }
        });

        // Meta tags
        $('meta').each((_, el) => {
          const name = $(el).attr('name') || $(el).attr('property');
          const content = $(el).attr('content');
          if (name && content) {
            pageMetadata.metaTags[name] = {
              value: content,
              location: locate(name)
            };
          }
        });

        // Structured Data JSON-LD
        const structuredData: any[] = [];
        $('script[type="application/ld+json"]').each((_, el) => {
          try {
            const rawJson = $(el).html();
            if (rawJson) {
              structuredData.push(JSON.parse(rawJson));
            }
          } catch {
            // Skip malformed schema blocks
          }
        });

        const page: Page = {
          route: res.route,
          sourcePath: res.sourcePath,
          rawHtml: html,
          headers: res.headers,
          metadata: pageMetadata,
          structuredData
        };

        builder.addPage(page);
      }
    }

    return builder.build();
  }
}
