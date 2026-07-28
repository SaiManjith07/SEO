import { defineRule } from '../engine.js';
import { extract } from '../analyzers/extract.js';
import type { Finding, PageContext, SiteContext } from '../types.js';

/**
 * The differentiating rules. No mainstream SEO tool surfaces these well.
 *
 * GPTBot, OAI-SearchBot, ClaudeBot and PerplexityBot do not execute
 * JavaScript. If content only exists after hydration, those engines see a
 * blank page — regardless of how well the page ranks in Google.
 */

/** Search/retrieval bots — blocking these removes you from AI answers. */
export const RETRIEVAL_BOTS = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'PerplexityBot',
  'Claude-SearchBot',
  'Google-Extended',
] as const;

/** Training-only bots — allowing these is a business decision, not a default. */
export const TRAINING_BOTS = ['GPTBot', 'ClaudeBot', 'CCBot', 'Bytespider'] as const;

export const clientSideOnlyContent = defineRule<PageContext>({
  id: 'ai-access/client-side-only-content',
  category: 'ai-access',
  severity: 'error',
  needs: 'page',
  description:
    'Content present only after JS execution is invisible to ChatGPT, Claude and Perplexity.',
  docs: 'See 04-technical-requirements.md §2',
  check(ctx) {
    if (!ctx.renderedHtml) return []; // nothing to diff against

    const raw = extract(ctx.rawHtml);
    const rendered = extract(ctx.renderedHtml);

    const findings: Finding[] = [];

    // Word-count ratio is the blunt but reliable signal.
    const ratio = rendered.wordCount === 0 ? 1 : raw.wordCount / rendered.wordCount;

    if (ratio < 0.5) {
      const hiddenPct = Math.round((1 - ratio) * 100);
      findings.push({
        ruleId: 'ai-access/client-side-only-content',
        severity: 'error',
        message:
          `${hiddenPct}% of this page's text is missing from the server response ` +
          `(${raw.wordCount} words raw vs ${rendered.wordCount} rendered). ` +
          `GPTBot, ClaudeBot and PerplexityBot will see the smaller version.`,
        fix:
          'Move this content to server-side rendering or static generation. ' +
          'In Next.js: render in a Server Component or use generateStaticParams. ' +
          'Client-only fetching in useEffect is invisible to every non-Google AI crawler.',
        location: { url: ctx.url },
        evidence: { rawWordCount: raw.wordCount, renderedWordCount: rendered.wordCount },
      });
    }

    if (raw.h1s.length === 0 && rendered.h1s.length > 0) {
      findings.push({
        ruleId: 'ai-access/client-side-only-content',
        severity: 'error',
        message: 'The <h1> exists only after JavaScript runs.',
        fix: 'Render the page heading server-side. It is the strongest single topical signal on the page.',
        location: { url: ctx.url },
      });
    }

    if (raw.jsonLd.length === 0 && rendered.jsonLd.length > 0) {
      findings.push({
        ruleId: 'ai-access/client-side-only-content',
        severity: 'warning',
        message: 'JSON-LD structured data is injected client-side only.',
        fix: 'Emit the <script type="application/ld+json"> block in the server response.',
        location: { url: ctx.url },
      });
    }

    return findings;
  },
});

export const emptyServerResponse = defineRule<PageContext>({
  id: 'ai-access/empty-server-response',
  category: 'ai-access',
  severity: 'error',
  needs: 'page',
  description: 'The server response contains almost no text — a classic SPA shell.',
  check(ctx) {
    const raw = extract(ctx.rawHtml);
    if (raw.wordCount >= 50) return [];
    return [
      {
        ruleId: 'ai-access/empty-server-response',
        severity: 'error',
        message:
          `Server response contains only ${raw.wordCount} words of text. ` +
          'This looks like a client-rendered shell.',
        fix:
          'Adopt SSR or SSG. Verify with: curl -s <url> | grep "<a key sentence>". ' +
          'If your content is not in that output, AI search engines cannot see it.',
        location: { url: ctx.url },
        evidence: { wordCount: raw.wordCount },
      },
    ];
  },
});

export const blockedAiCrawlers = defineRule<SiteContext>({
  id: 'ai-access/blocked-ai-crawlers',
  category: 'ai-access',
  severity: 'error',
  needs: 'site',
  description: 'robots.txt disallows AI retrieval bots.',
  check(ctx) {
    if (!ctx.robotsTxt) return [];
    const findings: Finding[] = [];
    const groups = parseRobots(ctx.robotsTxt);

    for (const bot of RETRIEVAL_BOTS) {
      const rules = groups.get(bot.toLowerCase()) ?? groups.get('*');
      if (!rules) continue;
      if (rules.some((r) => r.type === 'disallow' && r.path === '/')) {
        findings.push({
          ruleId: 'ai-access/blocked-ai-crawlers',
          severity: 'error',
          message: `robots.txt blocks ${bot} from the entire site.`,
          fix:
            `Add an explicit allow group:\n\nUser-agent: ${bot}\nAllow: /\n\n` +
            `${bot} is a retrieval bot — blocking it removes you from AI answers ` +
            'without preventing training.',
          location: { url: `${ctx.origin}/robots.txt` },
        });
      }
    }
    return findings;
  },
});

/**
 * Minimal robots.txt parser — good enough for the "blocked entirely" check.
 *
 * Per RFC 9309, consecutive User-agent lines form one group and share the
 * directives that follow. A User-agent line appearing *after* a directive
 * starts a new group.
 */
export function parseRobots(
  txt: string,
): Map<string, { type: 'allow' | 'disallow'; path: string }[]> {
  const groups = new Map<string, { type: 'allow' | 'disallow'; path: string }[]>();
  let currentAgents: string[] = [];
  let collectingAgents = false;

  for (const rawLine of txt.split(/\r?\n/)) {
    const line = rawLine.split('#')[0].trim();
    if (!line) continue;

    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (key === 'user-agent') {
      // A new agent after directives means a new group.
      if (!collectingAgents) currentAgents = [];
      collectingAgents = true;
      const agent = value.toLowerCase();
      currentAgents.push(agent);
      if (!groups.has(agent)) groups.set(agent, []);
    } else if (key === 'allow' || key === 'disallow') {
      collectingAgents = false;
      for (const agent of currentAgents) {
        groups.get(agent)?.push({ type: key, path: value });
      }
    }
  }
  return groups;
}
