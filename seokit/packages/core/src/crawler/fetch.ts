import type { PageContext } from '../types.js';

export interface FetchOptions {
  userAgent?: string;
  timeoutMs?: number;
  /** Run a headless browser to produce renderedHtml. Requires playwright. */
  render?: boolean;
}

/** User agents for the bots that matter, used by seo_check_ai_access. */
export const USER_AGENTS: Record<string, string> = {
  googlebot:
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  gptbot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1; +https://openai.com/gptbot',
  'oai-searchbot':
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot',
  claudebot: 'Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)',
  perplexitybot:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot',
  browser:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
};

/**
 * Fetch a page as a given user agent.
 *
 * `rawHtml` is what that bot actually receives. When `render` is set we also
 * populate `renderedHtml` via Playwright, so rules can diff the two — the
 * single most valuable check this tool performs.
 */
export async function fetchPage(
  url: string,
  opts: FetchOptions = {},
): Promise<PageContext> {
  const {
    userAgent = USER_AGENTS.browser,
    timeoutMs = 20_000,
    render = false,
  } = opts;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { 'user-agent': userAgent, accept: 'text/html,*/*' },
      redirect: 'follow',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  const rawHtml = await res.text();
  const headers: Record<string, string> = {};
  res.headers.forEach((v, k) => (headers[k.toLowerCase()] = v));

  const ctx: PageContext = {
    kind: 'page',
    url: res.url || url,
    status: res.status,
    headers,
    rawHtml,
  };

  if (render) {
    ctx.renderedHtml = await renderPage(url, userAgent, timeoutMs);
  }

  return ctx;
}

/**
 * Render with Playwright. Imported lazily so the package stays installable
 * without a 300MB browser download for users who only need static checks.
 */
async function renderPage(
  url: string,
  userAgent: string,
  timeoutMs: number,
): Promise<string | undefined> {
  let chromium: typeof import('playwright').chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    return undefined; // playwright not installed — skip rendering silently
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ userAgent });
    await page.goto(url, { waitUntil: 'networkidle', timeout: timeoutMs });
    return await page.content();
  } finally {
    await browser.close();
  }
}

/** Fetch robots.txt for an origin. Returns null on any failure. */
export async function fetchRobotsTxt(origin: string): Promise<string | null> {
  try {
    const res = await fetch(new URL('/robots.txt', origin).toString(), {
      headers: { 'user-agent': USER_AGENTS.browser },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/** Fetch llms.txt for an origin. Returns null on any failure. */
export async function fetchLlmsTxt(origin: string): Promise<string | null> {
  try {
    const res = await fetch(new URL('/llms.txt', origin).toString(), {
      headers: { 'user-agent': USER_AGENTS.browser },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}
