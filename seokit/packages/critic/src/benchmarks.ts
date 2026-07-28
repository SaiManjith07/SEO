import type { Benchmark } from './types.js';

/**
 * The benchmark registry.
 *
 * Every score the critic emits traces to an entry here. Nothing is invented:
 * each threshold is published by Google, the W3C, schema.org, or a
 * peer-reviewed paper. `critic_benchmarks` exposes this list so the grading
 * is auditable rather than a black box.
 */
export const BENCHMARKS: Benchmark[] = [
  // --- Indexability -------------------------------------------------------
  {
    id: 'index/http-ok',
    dimension: 'indexability',
    threshold: 'HTTP 200 on the final URL after redirects',
    authority: 'Google Search Central — Search Essentials',
    source: 'https://developers.google.com/search/docs/essentials',
  },
  {
    id: 'index/no-noindex',
    dimension: 'indexability',
    threshold: 'No noindex in meta robots or X-Robots-Tag header',
    authority: 'Google Search Central — Block indexing',
    source:
      'https://developers.google.com/search/docs/crawling-indexing/block-indexing',
  },
  {
    id: 'index/canonical-present',
    dimension: 'indexability',
    threshold: 'A rel=canonical is declared and absolute',
    authority: 'Google Search Central — Canonicalization',
    source:
      'https://developers.google.com/search/docs/crawling-indexing/canonicalization',
  },
  {
    id: 'index/googlebot-allowed',
    dimension: 'indexability',
    threshold: 'robots.txt does not disallow Googlebot from the URL',
    authority: 'RFC 9309 — Robots Exclusion Protocol',
    source: 'https://datatracker.ietf.org/doc/html/rfc9309',
  },

  // --- AI access ----------------------------------------------------------
  {
    id: 'ai/content-in-raw-html',
    dimension: 'ai_access',
    threshold: '>= 100 words of text present without executing JavaScript',
    authority:
      'Observed crawler behaviour — GPTBot, ClaudeBot and PerplexityBot do not render JS',
    source: 'https://platform.openai.com/docs/bots',
  },
  {
    id: 'ai/retrieval-bots-allowed',
    dimension: 'ai_access',
    threshold:
      'robots.txt does not block OAI-SearchBot, PerplexityBot, Claude-SearchBot or Google-Extended',
    authority: 'Vendor crawler documentation',
    source: 'https://platform.openai.com/docs/bots',
  },
  {
    id: 'ai/bots-receive-200',
    dimension: 'ai_access',
    threshold: 'AI user agents receive HTTP 200, not 403 from a CDN or WAF',
    authority: 'Cloudflare — AI crawler blocking is on by default on many plans',
    source: 'https://blog.cloudflare.com/ai-search-crawl-refer-ratio-on-radar/',
  },

  // --- Performance (real-user field data only) ----------------------------
  {
    id: 'perf/lcp',
    dimension: 'performance',
    threshold: 'Largest Contentful Paint < 2500ms at the 75th percentile',
    authority: 'Google — Core Web Vitals',
    source: 'https://web.dev/articles/lcp',
  },
  {
    id: 'perf/inp',
    dimension: 'performance',
    threshold: 'Interaction to Next Paint < 200ms at the 75th percentile',
    authority: 'Google — Core Web Vitals',
    source: 'https://web.dev/articles/inp',
  },
  {
    id: 'perf/cls',
    dimension: 'performance',
    threshold: 'Cumulative Layout Shift < 0.1 at the 75th percentile',
    authority: 'Google — Core Web Vitals',
    source: 'https://web.dev/articles/cls',
  },

  // --- Structured data ----------------------------------------------------
  {
    id: 'schema/valid-json',
    dimension: 'structured_data',
    threshold: 'Every application/ld+json block parses as valid JSON',
    authority: 'JSON-LD 1.1 (W3C Recommendation)',
    source: 'https://www.w3.org/TR/json-ld11/',
  },
  {
    id: 'schema/organization-present',
    dimension: 'structured_data',
    threshold: 'Organization (or subtype) declared with name and url',
    authority: 'schema.org / Google structured data guidelines',
    source: 'https://schema.org/Organization',
  },
  {
    id: 'schema/required-properties',
    dimension: 'structured_data',
    threshold: 'Declared types carry their required properties',
    authority: 'Google — Structured data general guidelines',
    source:
      'https://developers.google.com/search/docs/appearance/structured-data/sd-policies',
  },
  {
    id: 'schema/content-parity',
    dimension: 'structured_data',
    threshold: 'Marked-up content is visible in the rendered page',
    authority: 'Google — Spammy structured data policy',
    source:
      'https://developers.google.com/search/docs/essentials/spam-policies#structured-data',
  },

  // --- Content quality (Princeton GEO, peer-reviewed) ---------------------
  {
    id: 'geo/statistics-present',
    dimension: 'content_quality',
    threshold: 'Content contains concrete quantitative claims',
    authority: 'Aggarwal et al., GEO, ACM SIGKDD 2024 — measured +25.9% visibility',
    source: 'https://arxiv.org/abs/2311.09735',
  },
  {
    id: 'geo/citations-present',
    dimension: 'content_quality',
    threshold: '>= 3 outbound citations to external sources',
    authority: 'Aggarwal et al., GEO, ACM SIGKDD 2024 — measured +24.9% visibility',
    source: 'https://arxiv.org/abs/2311.09735',
  },
  {
    id: 'geo/quotations-present',
    dimension: 'content_quality',
    threshold: 'Content contains attributed quotations',
    authority: 'Aggarwal et al., GEO, ACM SIGKDD 2024 — measured +27.8% visibility',
    source: 'https://arxiv.org/abs/2311.09735',
  },
  {
    id: 'geo/sufficient-depth',
    dimension: 'content_quality',
    threshold: '>= 300 words of substantive text',
    authority: 'Google — Thin content / scaled content abuse policy',
    source: 'https://developers.google.com/search/docs/essentials/spam-policies',
  },

  // --- Semantics ----------------------------------------------------------
  {
    id: 'sem/single-h1',
    dimension: 'semantics',
    threshold: 'Exactly one h1 element',
    authority: 'HTML Living Standard — headings and sections',
    source: 'https://html.spec.whatwg.org/multipage/sections.html',
  },
  {
    id: 'sem/heading-order',
    dimension: 'semantics',
    threshold: 'Heading levels do not skip',
    authority: 'WCAG 2.2 — 1.3.1 Info and Relationships',
    source: 'https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships',
  },
  {
    id: 'sem/img-alt',
    dimension: 'semantics',
    threshold: 'Every img element has an alt attribute',
    authority: 'WCAG 2.2 — 1.1.1 Non-text Content (Level A)',
    source: 'https://www.w3.org/WAI/WCAG22/Understanding/non-text-content',
  },
  {
    id: 'sem/html-lang',
    dimension: 'semantics',
    threshold: 'html element declares a lang attribute',
    authority: 'WCAG 2.2 — 3.1.1 Language of Page (Level A)',
    source: 'https://www.w3.org/WAI/WCAG22/Understanding/language-of-page',
  },
  {
    id: 'sem/title-present',
    dimension: 'semantics',
    threshold: 'Non-empty title element',
    authority: 'WCAG 2.2 — 2.4.2 Page Titled (Level A)',
    source: 'https://www.w3.org/WAI/WCAG22/Understanding/page-titled',
  },
];

export function getBenchmark(id: string): Benchmark | undefined {
  return BENCHMARKS.find((b) => b.id === id);
}

export function benchmarksFor(dimension: string): Benchmark[] {
  return BENCHMARKS.filter((b) => b.dimension === dimension);
}
