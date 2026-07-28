import * as cheerio from 'cheerio';
import type { Check, DimensionId, DimensionScore, Evidence } from './types.js';
import { RETRIEVAL_BOTS, countWords, isBlocked } from './evidence/collect.js';
import { WEIGHTS, scoreDimension } from './reward.js';

/**
 * Turn raw Evidence into Checks against the benchmark registry.
 *
 * Every check states what was OBSERVED and what was EXPECTED, so the report
 * is falsifiable rather than an opinion.
 */
export function evaluate(ev: Evidence): {
  checks: Check[];
  dimensions: Record<DimensionId, DimensionScore>;
} {
  const $ = cheerio.load(ev.rawHtml);
  const path = safePath(ev.finalUrl || ev.url);
  const checks: Check[] = [
    ...indexability(ev, $, path),
    ...aiAccess(ev, path),
    ...performance(ev),
    ...structuredData(ev, $),
    ...contentQuality(ev, $),
    ...semantics($),
  ];

  const dimensions = {} as Record<DimensionId, DimensionScore>;
  for (const d of Object.keys(WEIGHTS) as DimensionId[]) {
    dimensions[d] = scoreDimension(d, checks);
  }
  return { checks, dimensions };
}

type $Type = cheerio.CheerioAPI;

// ---------------------------------------------------------------------------

function indexability(ev: Evidence, $: $Type, path: string): Check[] {
  const metaRobots = $('meta[name="robots"]').attr('content') ?? '';
  const xRobots = ev.headers['x-robots-tag'] ?? '';
  const noindex = /noindex/i.test(metaRobots) || /noindex/i.test(xRobots);
  const canonical = $('link[rel="canonical"]').attr('href') ?? '';

  return [
    {
      benchmarkId: 'index/http-ok',
      dimension: 'indexability',
      passed: ev.status === 200,
      observed: `HTTP ${ev.status}`,
      expected: 'HTTP 200',
      fix:
        ev.status === 200
          ? undefined
          : `Return HTTP 200 for this URL. Currently ${ev.status}.`,
    },
    {
      benchmarkId: 'index/no-noindex',
      dimension: 'indexability',
      passed: !noindex,
      observed: noindex
        ? `noindex present (meta="${metaRobots}" header="${xRobots}")`
        : 'no noindex directive',
      expected: 'no noindex',
      fix: noindex
        ? 'Remove the noindex directive from meta robots and the X-Robots-Tag header. This is frequently left over from staging.'
        : undefined,
    },
    {
      benchmarkId: 'index/canonical-present',
      dimension: 'indexability',
      passed: /^https?:\/\//i.test(canonical),
      observed: canonical || 'none',
      expected: 'absolute rel=canonical',
      fix: /^https?:\/\//i.test(canonical)
        ? undefined
        : 'Add a self-referencing absolute <link rel="canonical"> to the page head.',
    },
    {
      benchmarkId: 'index/googlebot-allowed',
      dimension: 'indexability',
      passed: !isBlocked(ev.robotsTxt, 'googlebot', path),
      observed: isBlocked(ev.robotsTxt, 'googlebot', path)
        ? 'robots.txt disallows Googlebot'
        : 'Googlebot allowed',
      expected: 'Googlebot not disallowed',
      fix: isBlocked(ev.robotsTxt, 'googlebot', path)
        ? 'Remove the Disallow rule covering this path for Googlebot.'
        : undefined,
    },
  ];
}

// ---------------------------------------------------------------------------

function aiAccess(ev: Evidence, path: string): Check[] {
  const rawWords = countWords(ev.rawHtml);

  const blockedBots = RETRIEVAL_BOTS.filter((b) =>
    isBlocked(ev.robotsTxt, b, path),
  );

  const forbidden = Object.entries(ev.botAccess)
    .filter(([, v]) => v.status === 403 || v.status === 429)
    .map(([k]) => k);

  return [
    {
      benchmarkId: 'ai/content-in-raw-html',
      dimension: 'ai_access',
      passed: rawWords >= 100,
      observed: `${rawWords} words in the server response`,
      expected: '>= 100 words without executing JavaScript',
      fix:
        rawWords >= 100
          ? undefined
          : 'Server-render the page content. GPTBot, ClaudeBot and PerplexityBot do not execute JavaScript, so client-rendered content is invisible to them. Verify with: curl -s <url> | grep "<a key sentence>"',
    },
    {
      benchmarkId: 'ai/retrieval-bots-allowed',
      dimension: 'ai_access',
      passed: blockedBots.length === 0,
      observed:
        blockedBots.length === 0
          ? 'all retrieval bots allowed'
          : `blocked: ${blockedBots.join(', ')}`,
      expected: 'no retrieval bot disallowed',
      fix: blockedBots.length
        ? `Add explicit allow groups in robots.txt for: ${blockedBots.join(', ')}. These are retrieval bots — blocking them removes you from AI answers without preventing training.`
        : undefined,
    },
    {
      benchmarkId: 'ai/bots-receive-200',
      dimension: 'ai_access',
      passed: forbidden.length === 0,
      observed:
        forbidden.length === 0
          ? 'all AI user agents received 200'
          : `${forbidden.join(', ')} received 403/429`,
      expected: 'HTTP 200 for AI user agents',
      fix: forbidden.length
        ? 'Your CDN or WAF is blocking AI crawlers at the edge. Check Cloudflare → Security → Bots → AI Scrapers and Crawlers, which is enabled by default on many plans. A permissive robots.txt does not help if the edge returns 403.'
        : undefined,
    },
  ];
}

// ---------------------------------------------------------------------------

/**
 * Performance is scored ONLY from CrUX real-user field data. Returning an
 * empty array marks the dimension unverified and redistributes its weight —
 * far better than substituting lab data Google does not rank on.
 */
function performance(ev: Evidence): Check[] {
  if (!ev.crux) return [];
  const { lcpMs, inpMs, cls } = ev.crux;
  const checks: Check[] = [];

  if (lcpMs !== null) {
    checks.push({
      benchmarkId: 'perf/lcp',
      dimension: 'performance',
      passed: lcpMs < 2500,
      observed: `${lcpMs}ms at p75 (${ev.crux.source})`,
      expected: '< 2500ms',
      fix:
        lcpMs < 2500
          ? undefined
          : 'Preload the LCP image, never lazy-load it, set fetchpriority="high", and remove render-blocking CSS/JS.',
    });
  }
  if (inpMs !== null) {
    checks.push({
      benchmarkId: 'perf/inp',
      dimension: 'performance',
      passed: inpMs < 200,
      observed: `${inpMs}ms at p75 (${ev.crux.source})`,
      expected: '< 200ms',
      fix:
        inpMs < 200
          ? undefined
          : 'Ship less JavaScript. Break long tasks with scheduler.yield(), defer third-party scripts, and debounce expensive handlers. INP is the most commonly failed vital.',
    });
  }
  if (cls !== null) {
    checks.push({
      benchmarkId: 'perf/cls',
      dimension: 'performance',
      passed: cls < 0.1,
      observed: `${cls} at p75 (${ev.crux.source})`,
      expected: '< 0.1',
      fix:
        cls < 0.1
          ? undefined
          : 'Set explicit width/height or aspect-ratio on images and reserve space for ads and embeds.',
    });
  }
  return checks;
}

// ---------------------------------------------------------------------------

function structuredData(ev: Evidence, $: $Type): Check[] {
  const blocks: { ok: boolean; data?: Record<string, unknown> }[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text().trim();
    if (!raw) return;
    try {
      blocks.push({ ok: true, data: JSON.parse(raw) });
    } catch {
      blocks.push({ ok: false });
    }
  });

  const nodes: Record<string, unknown>[] = [];
  const visit = (n: unknown): void => {
    if (Array.isArray(n)) return n.forEach(visit);
    if (n && typeof n === 'object') {
      const o = n as Record<string, unknown>;
      if (Array.isArray(o['@graph'])) (o['@graph'] as unknown[]).forEach(visit);
      if (o['@type']) nodes.push(o);
    }
  };
  blocks.forEach((b) => b.data && visit(b.data));

  const typeOf = (n: Record<string, unknown>): string[] => {
    const t = n['@type'];
    return typeof t === 'string' ? [t] : Array.isArray(t) ? (t as string[]) : [];
  };

  const orgNode = nodes.find((n) =>
    typeOf(n).some((t) =>
      ['Organization', 'Corporation', 'LocalBusiness', 'OnlineBusiness'].includes(t),
    ),
  );

  const REQUIRED: Record<string, string[]> = {
    Article: ['headline', 'datePublished'],
    BlogPosting: ['headline', 'datePublished'],
    Product: ['name'],
    Organization: ['name', 'url'],
    FAQPage: ['mainEntity'],
    HowTo: ['name', 'step'],
  };
  const missing: string[] = [];
  for (const n of nodes) {
    for (const t of typeOf(n)) {
      for (const prop of REQUIRED[t] ?? []) {
        if (!(prop in n)) missing.push(`${t}.${prop}`);
      }
    }
  }

  // Content parity: FAQ answers must be findable in the visible text.
  const visible = $('body').text().replace(/\s+/g, ' ').toLowerCase();
  const parityViolations: string[] = [];
  for (const n of nodes) {
    if (!typeOf(n).includes('FAQPage')) continue;
    const entities = n['mainEntity'];
    if (!Array.isArray(entities)) continue;
    for (const q of entities as Record<string, unknown>[]) {
      const a = q['acceptedAnswer'] as Record<string, unknown> | undefined;
      const txt = typeof a?.['text'] === 'string' ? a['text'] : null;
      if (!txt) continue;
      const probe = txt.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40);
      if (probe.length >= 15 && !visible.includes(probe.toLowerCase())) {
        parityViolations.push(probe);
      }
    }
  }

  return [
    {
      benchmarkId: 'schema/valid-json',
      dimension: 'structured_data',
      passed: blocks.every((b) => b.ok),
      observed: `${blocks.filter((b) => !b.ok).length} of ${blocks.length} blocks invalid`,
      expected: 'all JSON-LD blocks parse',
      fix: blocks.every((b) => b.ok)
        ? undefined
        : 'Fix the JSON syntax. An invalid block is discarded entirely. Trailing commas and unescaped quotes are the usual causes.',
    },
    {
      benchmarkId: 'schema/organization-present',
      dimension: 'structured_data',
      passed: !!orgNode,
      observed: orgNode ? 'Organization present' : 'no Organization schema',
      expected: 'Organization with name and url',
      fix: orgNode
        ? undefined
        : 'Add Organization schema with name, url, logo and a sameAs array listing your authoritative profiles. sameAs is the entity-disambiguation signal AI systems use to judge source reliability.',
    },
    {
      benchmarkId: 'schema/required-properties',
      dimension: 'structured_data',
      passed: missing.length === 0,
      observed: missing.length ? `missing: ${missing.join(', ')}` : 'all present',
      expected: 'required properties present on declared types',
      fix: missing.length
        ? `Add the missing properties: ${missing.join(', ')}.`
        : undefined,
    },
    {
      benchmarkId: 'schema/content-parity',
      dimension: 'structured_data',
      passed: parityViolations.length === 0,
      observed: parityViolations.length
        ? `${parityViolations.length} marked-up answers not visible on page`
        : 'marked-up content is visible',
      expected: 'schema mirrors visible content',
      fix: parityViolations.length
        ? 'Render every marked-up FAQ question and answer in the visible page body. Marking up invisible content violates Google\'s spammy structured data policy.'
        : undefined,
    },
  ];
}

// ---------------------------------------------------------------------------

function contentQuality(ev: Evidence, $: $Type): Check[] {
  const $c = cheerio.load(ev.rawHtml);
  $c('script, style, noscript, nav, footer, header').remove();
  const text = $c('body').text().replace(/\s+/g, ' ').trim();
  const words = text ? text.split(' ').length : 0;

  const stats = text.match(/\b\d+(\.\d+)?\s?(%|percent|x\b)|\b\d{2,}\b/g) ?? [];

  let origin = '';
  try {
    origin = new URL(ev.finalUrl || ev.url).origin;
  } catch {
    /* ignore */
  }
  const external = $('a[href]')
    .map((_, el) => $(el).attr('href') ?? '')
    .get()
    .filter((h) => /^https?:\/\//i.test(h) && (!origin || !h.startsWith(origin)));

  const quotes =
    $('blockquote, q, cite').length + (text.match(/[""][^""]{25,}[""]/g) ?? []).length;

  return [
    {
      benchmarkId: 'geo/sufficient-depth',
      dimension: 'content_quality',
      passed: words >= 300,
      observed: `${words} words`,
      expected: '>= 300 words',
      fix:
        words >= 300
          ? undefined
          : 'Expand the page to cover the topic completely. Thin pages are filtered under the scaled content policy and rarely retrieved.',
    },
    {
      benchmarkId: 'geo/statistics-present',
      dimension: 'content_quality',
      passed: stats.length >= 3,
      observed: `${stats.length} quantitative claims`,
      expected: '>= 3',
      fix:
        stats.length >= 3
          ? undefined
          : 'Replace qualitative claims with specific figures. Statistics Addition measured +25.9% visibility in the Princeton GEO benchmark (arXiv:2311.09735).',
    },
    {
      benchmarkId: 'geo/citations-present',
      dimension: 'content_quality',
      passed: external.length >= 3,
      observed: `${external.length} outbound citations`,
      expected: '>= 3',
      fix:
        external.length >= 3
          ? undefined
          : 'Link inline to the primary sources behind your claims. Cite Sources measured +24.9% visibility in the Princeton GEO benchmark.',
    },
    {
      benchmarkId: 'geo/quotations-present',
      dimension: 'content_quality',
      passed: quotes >= 1,
      observed: `${quotes} attributed quotations`,
      expected: '>= 1',
      fix:
        quotes >= 1
          ? undefined
          : 'Add attributed quotations from named, credible sources. Quotation Addition was the single strongest factor at +27.8% in the Princeton GEO benchmark.',
    },
  ];
}

// ---------------------------------------------------------------------------

function semantics($: $Type): Check[] {
  const h1s = $('h1').length;
  const title = $('title').first().text().trim();
  const lang = $('html').attr('lang') ?? '';

  const levels: number[] = [];
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const tag = (el as unknown as { tagName?: string }).tagName ?? 'h1';
    levels.push(Number(tag.replace(/\D/g, '')) || 1);
  });
  let skips = 0;
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] > levels[i - 1] + 1) skips++;
  }

  const imgs = $('img').length;
  const noAlt = $('img:not([alt])').length;

  return [
    {
      benchmarkId: 'sem/title-present',
      dimension: 'semantics',
      passed: title.length > 0,
      observed: title ? `"${title.slice(0, 60)}"` : 'no title',
      expected: 'non-empty <title>',
      fix: title ? undefined : 'Add a unique, descriptive <title> under 60 characters.',
    },
    {
      benchmarkId: 'sem/single-h1',
      dimension: 'semantics',
      passed: h1s === 1,
      observed: `${h1s} h1 elements`,
      expected: 'exactly 1',
      fix:
        h1s === 1
          ? undefined
          : h1s === 0
            ? 'Add a single <h1> stating the page topic, as a real heading tag rather than a styled div.'
            : 'Keep one <h1> and demote the others to <h2>.',
    },
    {
      benchmarkId: 'sem/heading-order',
      dimension: 'semantics',
      passed: skips === 0,
      observed: `${skips} skipped heading levels`,
      expected: 'no skipped levels',
      fix: skips === 0 ? undefined : 'Fix the heading hierarchy so levels never skip.',
    },
    {
      benchmarkId: 'sem/img-alt',
      dimension: 'semantics',
      passed: noAlt === 0,
      observed: `${noAlt} of ${imgs} images lack alt`,
      expected: 'every img has alt',
      fix:
        noAlt === 0
          ? undefined
          : 'Add descriptive alt text. Use alt="" only for genuinely decorative images.',
    },
    {
      benchmarkId: 'sem/html-lang',
      dimension: 'semantics',
      passed: lang.length > 0,
      observed: lang || 'no lang attribute',
      expected: 'lang declared',
      fix: lang ? undefined : 'Add lang="en" (or the correct BCP-47 code) to <html>.',
    },
  ];
}

function safePath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return '/';
  }
}
