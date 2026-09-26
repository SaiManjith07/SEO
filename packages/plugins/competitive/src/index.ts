import { XMLParser } from 'fast-xml-parser';
import * as zlib from 'zlib';

export interface SitemapEntry {
  loc: string;
  lastmod?: string;
}

export interface SitemapDiff {
  onlyTheirs: SitemapEntry[];
  onlyMine: SitemapEntry[];
  both: string[];
}

export class CompetitiveSitemapPlugin {
  private parser = new XMLParser({
    ignoreAttributes: false,
    parseAttributeValue: true,
  });

  public async fetchSitemap(url: string, depth = 0): Promise<SitemapEntry[]> {
    if (depth > 5) return []; // prevent infinite recursion
    try {
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404 && depth === 0) {
          // try sitemap_index.xml if we tried sitemap.xml
          if (url.endsWith('/sitemap.xml')) {
            return this.fetchSitemap(url.replace('/sitemap.xml', '/sitemap_index.xml'), depth + 1);
          }
        }
        return [];
      }

      const buffer = await response.arrayBuffer();
      let content = '';

      // Handle gzip
      if (url.endsWith('.gz') || response.headers.get('content-type')?.includes('gzip')) {
        content = zlib.gunzipSync(Buffer.from(buffer)).toString('utf-8');
      } else {
        content = Buffer.from(buffer).toString('utf-8');
      }

      const parsed = this.parser.parse(content);
      const entries: SitemapEntry[] = [];

      // Handle sitemap index
      if (parsed.sitemapindex && parsed.sitemapindex.sitemap) {
        const sitemaps = Array.isArray(parsed.sitemapindex.sitemap)
          ? parsed.sitemapindex.sitemap
          : [parsed.sitemapindex.sitemap];
        
        for (const sm of sitemaps) {
          if (sm.loc) {
            const subEntries = await this.fetchSitemap(sm.loc, depth + 1);
            entries.push(...subEntries);
          }
        }
      } 
      // Handle urlset
      else if (parsed.urlset && parsed.urlset.url) {
        const urls = Array.isArray(parsed.urlset.url)
          ? parsed.urlset.url
          : [parsed.urlset.url];
        
        for (const u of urls) {
          if (u.loc) {
            entries.push({ loc: u.loc, lastmod: u.lastmod });
          }
        }
      }

      return entries;
    } catch (err) {
      return [];
    }
  }

  public diffSitemaps(mine: SitemapEntry[], theirs: SitemapEntry[], keepQuery = false): SitemapDiff {
    const normalize = (loc: string) => {
      try {
        const urlObj = new URL(loc);
        let pathname = urlObj.pathname.replace(/\/$/, '');
        if (pathname === '') pathname = '/';
        let res = pathname;
        if (keepQuery && urlObj.search) {
          res += urlObj.search;
        }
        return res;
      } catch {
        return loc;
      }
    };

    const myMap = new Map<string, SitemapEntry>();
    for (const e of mine) {
      myMap.set(normalize(e.loc), e);
    }

    const theirMap = new Map<string, SitemapEntry>();
    for (const e of theirs) {
      theirMap.set(normalize(e.loc), e);
    }

    const diff: SitemapDiff = {
      onlyTheirs: [],
      onlyMine: [],
      both: []
    };

    for (const [normLoc, entry] of theirMap.entries()) {
      if (myMap.has(normLoc)) {
        diff.both.push(entry.loc);
      } else {
        diff.onlyTheirs.push(entry);
      }
    }

    for (const [normLoc, entry] of myMap.entries()) {
      if (!theirMap.has(normLoc)) {
        diff.onlyMine.push(entry);
      }
    }

    // Sort onlyTheirs by lastmod desc, then path depth
    diff.onlyTheirs.sort((a, b) => {
      if (a.lastmod && b.lastmod) {
        const dA = new Date(a.lastmod).getTime();
        const dB = new Date(b.lastmod).getTime();
        if (dA !== dB && !isNaN(dA) && !isNaN(dB)) {
          return dB - dA; // Descending
        }
      }
      
      const depthA = a.loc.split('/').length;
      const depthB = b.loc.split('/').length;
      return depthA - depthB;
    });

    return diff;
  }
}

export interface EntityPresence {
  hasWikidata: boolean;
  wikidataId?: string;
  hasWikipediaArticle: boolean;
  wikipediaUrl?: string;
  organizationSchemaSameAs: string[];
  sameAsCoverage: number;
}

export class CompetitiveEntityPlugin {
  public async checkEntity(domain: string): Promise<EntityPresence> {
    const presence: EntityPresence = {
      hasWikidata: false,
      hasWikipediaArticle: false,
      organizationSchemaSameAs: [],
      sameAsCoverage: 0
    };

    try {
      const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
      
      const sparql = `
        SELECT ?item ?wikipediaUrl WHERE {
          { ?item wdt:P856 <https://${cleanDomain}/> }
          UNION { ?item wdt:P856 <http://${cleanDomain}/> }
          UNION { ?item wdt:P856 <https://www.${cleanDomain}/> }
          UNION { ?item wdt:P856 <http://www.${cleanDomain}/> }
          UNION { ?item wdt:P856 <https://${cleanDomain}> }
          UNION { ?item wdt:P856 <http://${cleanDomain}> }
          UNION { ?item wdt:P856 <https://www.${cleanDomain}> }
          UNION { ?item wdt:P856 <http://www.${cleanDomain}> }
          OPTIONAL {
            ?wikipediaUrl schema:about ?item ;
              schema:isPartOf <https://en.wikipedia.org/> .
          }
        } LIMIT 1
      `;
      
      const res = await fetch(`https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}`, {
        headers: { 'Accept': 'application/sparql-results+json', 'User-Agent': 'SEOKit/1.0' },
        signal: AbortSignal.timeout(5000)
      });
      
      if (res.ok) {
        const data = await res.json();
        const bindings = data.results?.bindings;
        if (bindings && bindings.length > 0) {
          presence.hasWikidata = true;
          presence.wikidataId = bindings[0].item?.value?.split('/').pop();
          if (bindings[0].wikipediaUrl?.value) {
            presence.hasWikipediaArticle = true;
            presence.wikipediaUrl = bindings[0].wikipediaUrl.value;
          }
        }
      }
    } catch {
      // Ignore
    }

    // Set a very basic sameAsCoverage (e.g. 1.0 if wikidata is present, 0 otherwise)
    if (presence.hasWikidata) {
      presence.organizationSchemaSameAs.push(`https://www.wikidata.org/wiki/${presence.wikidataId}`);
      if (presence.hasWikipediaArticle && presence.wikipediaUrl) {
        presence.organizationSchemaSameAs.push(presence.wikipediaUrl);
      }
      presence.sameAsCoverage = presence.organizationSchemaSameAs.length * 50;
      if (presence.sameAsCoverage > 100) presence.sameAsCoverage = 100;
    }

    return presence;
  }
}
