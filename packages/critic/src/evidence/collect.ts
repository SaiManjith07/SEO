import * as cheerio from 'cheerio';
import type { CruxMetrics, Evidence } from '../types.js';

/**
 * Independent evidence collection.
 *
 * Deliberately does NOT reuse @seokit/core's fetcher. Sharing it would couple
 * the two servers and let a bug in one silently mask itself in the other.
 */

export const BOT_AGENTS: Record<string, string> = {
  googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'oai-searchbot':
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot',
  gptbot:
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1; +https://openai.com/gptbot',
  claudebot: 'Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)',
  perplexitybot:
    'Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)',
};

/** Bots whose blocking removes you from AI answers (as opposed to training). */
export const RETRIEVAL_BOTS = [
  'OAI-SearchBot',
  'PerplexityBot',
  'Claude-SearchBot',
  'Google-Extended',
];

export interface CollectOptions {
  /** Google API key for the CrUX API. Without it, performance is unverified. */
  cruxApiKey?: string;
  timeoutMs?: number;
}

export async function collectEvidence(
  url: string,
  opts: CollectOptions = {},
): Promise<Evidence> {
  const { timeoutMs = 20_000 } = opts;

  const primary = await fetchAs(url, BOT_AGENTS.googlebot, timeoutMs);
  const origin = new URL(primary.finalUrl || url).origin;

  const robotsTxt = await fetchText(`${origin}/robots.txt`, timeoutMs);

  // Fetch as each AI bot to detect edge/WAF blocking that robots.txt won't show.
  const botAccess: Evidence['botAccess'] = {};
  for (const [name, ua] of Object.entries(BOT_AGENTS)) {
    try {
      const r = await fetchAs(url, ua, timeoutMs);
      botAccess[name] = { status: r.status, wordCount: countWords(r.body) };
    } catch {
      botAccess[name] = { status: 0, wordCount: 0 };
    }
  }

  const crux = opts.cruxApiKey
    ? await fetchCrux(url, opts.cruxApiKey).catch(() => null)
    : null;

  return {
    url,
    finalUrl: primary.finalUrl,
    status: primary.status,
    headers: primary.headers,
    rawHtml: primary.body,
    robotsTxt,
    botAccess,
    crux,
    fetchedAt: new Date().toISOString(),
  };
}

interface FetchResult {
  status: number;
  finalUrl: string;
  headers: Record<string, string>;
  body: string;
}

async function fetchAs(
  url: string,
  userAgent: string,
  timeoutMs: number,
): Promise<FetchResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': userAgent, accept: 'text/html,*/*' },
      redirect: 'follow',
      signal: controller.signal,
    });
    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => (headers[k.toLowerCase()] = v));
    return {
      status: res.status,
      finalUrl: res.url || url,
      headers,
      body: await res.text(),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchText(url: string, timeoutMs: number): Promise<string | null> {
  try {
    const r = await fetchAs(url, BOT_AGENTS.googlebot, timeoutMs);
    return r.status === 200 ? r.body : null;
  } catch {
    return null;
  }
}

/**
 * Real-user field data from the Chrome UX Report.
 *
 * This is the only dimension the builder cannot fabricate from HTML — it is
 * measured on real users' devices. That makes it the critic's strongest
 * anti-reward-hacking signal.
 */
async function fetchCrux(url: string, apiKey: string): Promise<CruxMetrics | null> {
  const endpoint = `https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=${apiKey}`;

  const query = async (body: Record<string, unknown>): Promise<unknown> => {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return res.json();
  };

  // Prefer URL-level data; fall back to origin-level when the URL lacks traffic.
  let source: CruxMetrics['source'] = 'crux-url';
  let data = (await query({ url })) as CruxRecord | null;
  if (!data?.record) {
    source = 'crux-origin';
    data = (await query({ origin: new URL(url).origin })) as CruxRecord | null;
  }
  if (!data?.record?.metrics) return null;

  // CrUX returns CLS as a string and the timing metrics as numbers; normalise.
  const num = (v: number | string | undefined): number | null => {
    if (v === undefined) return null;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const m = data.record.metrics;
  return {
    lcpMs: num(m.largest_contentful_paint?.percentiles?.p75),
    inpMs: num(m.interaction_to_next_paint?.percentiles?.p75),
    cls: num(m.cumulative_layout_shift?.percentiles?.p75),
    source,
  };
}

interface CruxRecord {
  record?: {
    metrics?: Record<string, { percentiles?: { p75?: number | string } }>;
  };
}

export function countWords(html: string): number {
  const $ = cheerio.load(html);
  $('script, style, noscript, template').remove();
  const text = $('body').text().replace(/\s+/g, ' ').trim();
  return text ? text.split(' ').length : 0;
}

/** Minimal robots.txt group parser (RFC 9309 grouping semantics). */
export function parseRobotsGroups(
  txt: string,
): Map<string, { type: 'allow' | 'disallow'; path: string }[]> {
  const groups = new Map<string, { type: 'allow' | 'disallow'; path: string }[]>();
  let agents: string[] = [];
  let collecting = false;

  for (const rawLine of txt.split(/\r?\n/)) {
    const line = rawLine.split('#')[0].trim();
    if (!line) continue;
    const i = line.indexOf(':');
    if (i === -1) continue;
    const key = line.slice(0, i).trim().toLowerCase();
    const value = line.slice(i + 1).trim();

    if (key === 'user-agent') {
      if (!collecting) agents = [];
      collecting = true;
      const a = value.toLowerCase();
      agents.push(a);
      if (!groups.has(a)) groups.set(a, []);
    } else if (key === 'allow' || key === 'disallow') {
      collecting = false;
      for (const a of agents) groups.get(a)?.push({ type: key, path: value });
    }
  }
  return groups;
}

/** True when robots.txt disallows the given path for the given agent. */
export function isBlocked(
  robotsTxt: string | null,
  agent: string,
  path: string,
): boolean {
  if (!robotsTxt) return false;
  const groups = parseRobotsGroups(robotsTxt);
  const rules = groups.get(agent.toLowerCase()) ?? groups.get('*');
  if (!rules) return false;

  // Longest-match wins, per RFC 9309.
  let best: { type: 'allow' | 'disallow'; path: string } | null = null;
  for (const r of rules) {
    const p = r.path;
    if (p === '') continue;
    if (path.startsWith(p) && (!best || p.length > best.path.length)) best = r;
  }
  if (!best) return rules.some((r) => r.type === 'disallow' && r.path === '/');
  return best.type === 'disallow';
}
