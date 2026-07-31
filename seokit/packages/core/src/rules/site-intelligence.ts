import { defineRule } from '../engine.js';
import { extract } from '../analyzers/extract.js';
import type { Finding, SiteContext } from '../types.js';

/**
 * Calculates Jaccard token similarity between two strings.
 * splits on whitespace and cleans punctuation.
 */
function calculateJaccardSimilarity(str1: string, str2: string): number {
  const clean = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(Boolean);

  const tokens1 = new Set(clean(str1));
  const tokens2 = new Set(clean(str2));

  if (tokens1.size === 0 && tokens2.size === 0) return 1.0;

  let intersectionCount = 0;
  for (const token of tokens1) {
    if (tokens2.has(token)) {
      intersectionCount++;
    }
  }

  const unionCount = tokens1.size + tokens2.size - intersectionCount;
  return intersectionCount / unionCount;
}

/**
 * Flags keyword cannibalization using Jaccard Similarity checks.
 */
export const keywordCannibalization = defineRule<SiteContext>({
  id: 'site/keyword-cannibalization',
  category: 'aeo',
  severity: 'warning',
  needs: 'site',
  dependencies: ['html/missing-title', 'html/missing-h1'],
  description: 'Detects if multiple pages target highly similar keywords/titles.',
  check(ctx) {
    const findings: Finding[] = [];
    const config = ctx.config?.intelligence;
    const similarityThreshold = config?.cannibalizationSimilarity ?? 0.85;

    // Build page data maps
    const pageData = ctx.pages.map((page) => {
      const parsed = extract(page.rawHtml);
      let pathname = '';
      try {
        pathname = new URL(page.url).pathname;
      } catch {
        pathname = page.url;
      }
      return {
        url: page.url,
        pathname,
        title: parsed.title || '',
        h1s: parsed.h1s.join(' ')
      };
    });

    for (let i = 0; i < pageData.length; i++) {
      for (let j = i + 1; j < pageData.length; j++) {
        const p1 = pageData[i];
        const p2 = pageData[j];

        // 1. Title Cannibalization Check
        if (p1.title && p2.title) {
          const titleSim = calculateJaccardSimilarity(p1.title, p2.title);
          if (titleSim >= similarityThreshold) {
            findings.push({
              ruleId: 'site/keyword-cannibalization',
              severity: 'warning',
              message: `Keyword cannibalization warning: "${p1.url}" and "${p2.url}" have highly similar titles (${Math.round(titleSim * 100)}% match).`,
              fix: 'Update metadata tags to target distinct keywords or merge the pages.',
              evidence: { urls: [p1.url, p2.url], similarity: titleSim }
            });
          }
        }

        // 2. H1 Cannibalization Check
        if (p1.h1s && p2.h1s) {
          const h1Sim = calculateJaccardSimilarity(p1.h1s, p2.h1s);
          if (h1Sim >= similarityThreshold) {
            findings.push({
              ruleId: 'site/keyword-cannibalization',
              severity: 'warning',
              message: `Keyword cannibalization warning: "${p1.url}" and "${p2.url}" share highly similar H1 headings (${Math.round(h1Sim * 100)}% match).`,
              fix: 'Differentiate header text values to target unique subtopics.',
              evidence: { urls: [p1.url, p2.url], similarity: h1Sim }
            });
          }
        }

        // 3. Slug Similarity Check
        if (p1.pathname && p2.pathname && p1.pathname !== '/' && p2.pathname !== '/') {
          const cleanSlug = (path: string) => path.replace(/^\/|\/$/g, '').replace(/[-_]/g, ' ');
          const slugSim = calculateJaccardSimilarity(cleanSlug(p1.pathname), cleanSlug(p2.pathname));
          if (slugSim >= similarityThreshold) {
            findings.push({
              ruleId: 'site/keyword-cannibalization',
              severity: 'warning',
              message: `Keyword cannibalization warning: URLs "${p1.url}" and "${p2.url}" have highly similar slugs (${Math.round(slugSim * 100)}% match).`,
              fix: 'Differentiate url routing pathways to clarify search engine index separation.',
              evidence: { urls: [p1.url, p2.url], similarity: slugSim }
            });
          }
        }
      }
    }

    return findings;
  }
});

/**
 * Flags orphan pages excluding redirects, noindex pages, and pattern matches.
 */
export const orphanPages = defineRule<SiteContext>({
  id: 'site/orphan-pages',
  category: 'technical',
  severity: 'warning',
  needs: 'site',
  dependencies: ['html/noindex-present'],
  description: 'Identify pages with no incoming internal links.',
  check(ctx) {
    const findings: Finding[] = [];
    const config = ctx.config?.intelligence;
    const exclusions = config?.orphanExclusions || [];
    const inbound = new Set<string>();

    for (const links of ctx.linkGraph.values()) {
      for (const link of links) {
        try {
          const absoluteUrl = new URL(link, ctx.origin).href;
          inbound.add(absoluteUrl);
        } catch {
          inbound.add(link);
        }
      }
    }

    for (const page of ctx.pages) {
      // Exclude homepage/root origin from orphan checks
      if (page.url === ctx.origin || page.url === `${ctx.origin}/` || page.url === `${ctx.origin}/index.html`) {
        continue;
      }

      // Exclusion 1: Redirect pages (status 3xx)
      if (page.status >= 300 && page.status < 400) {
        continue;
      }

      // Exclusion 2: noindex pages
      const isNoindex = page.rawHtml.toLowerCase().includes('content="noindex"');
      if (isNoindex) {
        continue;
      }

      // Exclusion 3: Configured path exclusions
      const isExcluded = exclusions.some((pattern: string) => {
        try {
          const regex = new RegExp(pattern, 'i');
          return regex.test(page.url);
        } catch {
          return page.url.toLowerCase().includes(pattern.toLowerCase());
        }
      });
      if (isExcluded) {
        continue;
      }

      if (!inbound.has(page.url)) {
        findings.push({
          ruleId: 'site/orphan-pages',
          severity: 'warning',
          message: `Orphan page found: "${page.url}" has no inbound internal link references.`,
          fix: 'Add links leading to this page from relevant context pages.',
          location: { url: page.url }
        });
      }
    }

    return findings;
  }
});

/**
 * Flags thin content pages containing word counts lower than thresholds.
 */
export const thinContent = defineRule<SiteContext>({
  id: 'site/thin-content',
  category: 'content',
  severity: 'warning',
  needs: 'site',
  dependencies: ['html/missing-title'],
  description: 'Find pages with thin textual content.',
  check(ctx) {
    const findings: Finding[] = [];
    const config = ctx.config?.intelligence;
    const defaultThreshold = config?.thinContentThreshold ?? 200;

    for (const page of ctx.pages) {
      const parsed = extract(page.rawHtml);

      // Exclude simple boilerplate templates/pages from fixed high threshold checks
      let threshold = defaultThreshold;
      if (page.url.includes('/faq') || page.url.includes('/contact')) {
        threshold = Math.min(100, defaultThreshold); // Lower threshold for Contact/FAQ utility pages
      }

      if (parsed.wordCount < threshold) {
        findings.push({
          ruleId: 'site/thin-content',
          severity: 'warning',
          message: `Thin content detected: "${page.url}" contains only ${parsed.wordCount} words (minimum threshold: ${threshold} words).`,
          fix: 'Expand the page content with useful information or detailed explanations.',
          location: { url: page.url },
          evidence: { wordCount: parsed.wordCount, threshold }
        });
      }
    }

    return findings;
  }
});

/**
 * Flags identical or highly similar duplicate content pages, respecting Canonical URLs.
 */
export const duplicateContent = defineRule<SiteContext>({
  id: 'site/duplicate-content',
  category: 'content',
  severity: 'warning',
  needs: 'site',
  dependencies: ['html/missing-canonical'],
  description: 'Identify similar or identical text contents served across URLs.',
  check(ctx) {
    const findings: Finding[] = [];
    const config = ctx.config?.intelligence;
    const duplicateThreshold = config?.duplicateSimilarity ?? 0.85;

    // Filter pages and extract text
    const pageTexts = ctx.pages
      .map((page) => {
        const parsed = extract(page.rawHtml);

        // Canonical URL check: If the page canonicalizes to another URL, it is exempt from duplicate content penalties
        if (parsed.canonical) {
          try {
            const absCanonical = new URL(parsed.canonical, ctx.origin).href;
            if (absCanonical !== page.url) {
              return null; // Exempt
            }
          } catch {
            if (parsed.canonical !== page.url) {
              return null; // Exempt
            }
          }
        }

        // Strip boilerplate head info
        const cleanText = (parsed.title + ' ' + parsed.h1s.join(' ')).trim();
        return {
          url: page.url,
          text: cleanText
        };
      })
      .filter((p): p is { url: string; text: string } => p !== null && p.text.length > 10);

    for (let i = 0; i < pageTexts.length; i++) {
      for (let j = i + 1; j < pageTexts.length; j++) {
        const p1 = pageTexts[i];
        const p2 = pageTexts[j];

        const similarity = calculateJaccardSimilarity(p1.text, p2.text);
        if (similarity >= duplicateThreshold) {
          findings.push({
            ruleId: 'site/duplicate-content',
            severity: 'warning',
            message: `Duplicate content warning: "${p1.url}" and "${p2.url}" serve substantially similar text (${Math.round(similarity * 100)}% match).`,
            fix: 'Set matching canonical headers or rewrite the pages to define unique text contexts.',
            evidence: { urls: [p1.url, p2.url], similarity }
          });
        }
      }
    }

    return findings;
  }
});

/**
 * Flags missing E-E-A-T site-wide trust pages and validation protocols.
 */
export const eeatTrustPages = defineRule<SiteContext>({
  id: 'site/eeat-trust-pages',
  category: 'technical',
  severity: 'warning',
  needs: 'site',
  dependencies: ['html/missing-title'],
  description: 'Verifies the presence of crucial E-E-A-T trust signals (About, Contact, Privacy policy).',
  check(ctx) {
    const findings: Finding[] = [];
    const config = ctx.config?.intelligence;
    const requiredPages = config?.requiredEeatPages || ['about', 'contact', 'privacy', 'terms'];
    const urls = ctx.pages.map((p) => p.url.toLowerCase());

    // 1. Trust Pages Validation
    for (const pageType of requiredPages) {
      const match = urls.some((u) => u.includes(`/${pageType}`) || u.includes(`/${pageType}-us`) || u.includes(`/${pageType}-of-service`));
      if (!match) {
        findings.push({
          ruleId: 'site/eeat-trust-pages',
          severity: 'warning',
          message: `E-E-A-T Signal Missing: A dedicated "${pageType}" page was not found in the crawl.`,
          fix: `Create a dedicated "${pageType}" page to improve domain authority and trust scoring.`,
          location: { url: ctx.origin }
        });
      }
    }

    // 2. SSL HTTPS Verification
    for (const page of ctx.pages) {
      if (page.url.startsWith('http://')) {
        findings.push({
          ruleId: 'site/eeat-trust-pages',
          severity: 'warning',
          message: `E-E-A-T Trust Check: "${page.url}" is served over insecure HTTP protocol.`,
          fix: 'Configure SSL certificates and redirect all traffic from http to https.',
          location: { url: page.url }
        });
      }

      // 3. Structured Author / Publisher schema validation
      const hasAuthorSchema = page.rawHtml.includes('"author"') || page.rawHtml.includes('"publisher"');
      const isArticlePage = page.url.includes('/blog/') || page.url.includes('/article/');
      if (isArticlePage && !hasAuthorSchema) {
        findings.push({
          ruleId: 'site/eeat-trust-pages',
          severity: 'warning',
          message: `E-E-A-T Editorial Attribution: "${page.url}" lacks explicit structured author or publisher schemas.`,
          fix: 'Embed Schema.org Author or Publisher JSON-LD markup blocks to establish editorial authority.',
          location: { url: page.url }
        });
      }
    }

    return findings;
  }
});
