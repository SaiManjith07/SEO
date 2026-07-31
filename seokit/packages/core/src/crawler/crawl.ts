import * as cheerio from 'cheerio';
import { fetchPage, fetchRobotsTxt, fetchLlmsTxt } from './fetch.js';
import { calculatePageRank } from '../analyzers/pagerank.js';
import { startSpan } from '../platform/tracing.js';
import type { SiteContext, PageContext } from '../types.js';

const ASSET_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp',
  '.pdf', '.zip', '.tar', '.gz', '.mp3', '.mp4', '.avi',
  '.css', '.js', '.json', '.xml', '.txt'
];

function isAssetUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    const pathname = url.pathname.toLowerCase();
    return ASSET_EXTENSIONS.some(ext => pathname.endsWith(ext));
  } catch {
    return true;
  }
}

export async function crawlSite(
  startUrl: string,
  maxPages: number = 10,
  render: boolean = false
): Promise<SiteContext> {
  const crawlSpan = startSpan('crawl-site');
  crawlSpan.setAttribute('startUrl', startUrl);
  crawlSpan.setAttribute('maxPages', maxPages);

  try {
    const start = new URL(startUrl);
    const origin = start.origin;
  
  const visited = new Set<string>();
  const queue: string[] = [start.toString()];
  const pages: PageContext[] = [];
  const linkGraph = new Map<string, string[]>();
  
  // 1. Fetch robots.txt, llms.txt and sitemap references
  const robotsTxt = await fetchRobotsTxt(origin);
  const llmsTxt = await fetchLlmsTxt(origin);
  const sitemapUrls: string[] = [];
  
  if (robotsTxt) {
    const sitemapMatches = robotsTxt.match(/sitemap:\s*(https?:\/\/[^\r\n]+)/gi) || [];
    for (const match of sitemapMatches) {
      const parts = match.split(/:\s+/);
      if (parts[1]) {
        sitemapUrls.push(parts[1].trim());
      }
    }
  }

  // 2. Queue-based crawl loop
  while (queue.length > 0 && pages.length < maxPages) {
    const currentUrl = queue.shift()!;
    if (visited.has(currentUrl)) continue;
    visited.add(currentUrl);

    try {
      const pageCtx = await fetchPage(currentUrl, { render });
      pages.push(pageCtx);

      if (pageCtx.status >= 200 && pageCtx.status < 300) {
        // Parse HTML and extract links
        const $ = cheerio.load(pageCtx.rawHtml);
        const outboundLinks: string[] = [];
        
        $('a[href]').each((_, el) => {
          const href = $(el).attr('href');
          if (!href) return;
          
          try {
            const resolved = new URL(href, currentUrl).toString();
            const parsedResolved = new URL(resolved);
            
            // Check if link is internal (same origin) and not an asset file
            if (parsedResolved.origin === origin && !isAssetUrl(resolved)) {
              outboundLinks.push(resolved);
              
              if (!visited.has(resolved) && !queue.includes(resolved)) {
                queue.push(resolved);
              }
            }
          } catch {
            // Ignore malformed URLs
          }
        });
        
        linkGraph.set(currentUrl, Array.from(new Set(outboundLinks)));
      }
    } catch {
      // Skip unreachable pages
    }
  }

  // 3. Compute PageRank
  const pageRanks = calculatePageRank(linkGraph);

  return {
    kind: 'site',
    origin,
    pages,
    robotsTxt,
    llmsTxt,
    sitemapUrls,
    linkGraph,
    pageRanks,
  };
  } finally {
    crawlSpan.end();
  }
}
