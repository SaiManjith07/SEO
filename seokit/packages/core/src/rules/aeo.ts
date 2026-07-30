import { defineRule } from '../engine.js';
import { extract } from '../analyzers/extract.js';
import type { Finding, PageContext } from '../types.js';

/**
 * AEO / GEO rules.
 *
 * These encode the Princeton GEO findings (arXiv:2311.09735) and observed
 * citation behaviour: passages are retrieved independently, so each section
 * must answer directly, stand alone, and carry verifiable specifics.
 */

const PRONOUN_RE =
  /\b(it|its|they|them|their|this|that|these|those|he|she|his|her)\b/gi;

export const noQuestionHeadings = defineRule<PageContext>({
  id: 'aeo/no-question-headings',
  category: 'aeo',
  severity: 'info',
  needs: 'page',
  description:
    'Question-shaped headings match query phrasing and become candidate answers.',
  docs: 'See 02-AEO-answer-engine-optimization.md §4.2',
  check(ctx) {
    const { headings } = extract(ctx.rawHtml);
    const subs = headings.filter((h) => h.level >= 2);
    if (subs.length === 0) return [];

    const questions = subs.filter(
      (h) =>
        h.text.trim().endsWith('?') ||
        /^(how|what|why|when|where|which|who|can|should|is|are|does|do)\b/i.test(
          h.text.trim(),
        ),
    );

    if (questions.length / subs.length >= 0.3) return [];

    return [
      {
        ruleId: 'aeo/no-question-headings',
        severity: 'info',
        message: `Only ${questions.length} of ${subs.length} subheadings are question-shaped.`,
        fix:
          'Rewrite headings to match real query phrasing from Search Console or ' +
          'People Also Ask — "How much does X cost?" rather than "Cost Considerations". ' +
          'When a heading matches the query, the content beneath it becomes the candidate answer.',
        location: { url: ctx.url },
      },
    ];
  },
});

export const noStatistics = defineRule<PageContext>({
  id: 'aeo/no-statistics',
  category: 'aeo',
  severity: 'info',
  needs: 'page',
  description:
    'Adding statistics raised generative-engine visibility ~25.9% in the Princeton GEO study.',
  docs: 'https://arxiv.org/abs/2311.09735',
  check(ctx) {
    const { text, wordCount } = extract(ctx.rawHtml);
    if (wordCount < 200) return [];

    const numbers = text.match(/\b\d+(\.\d+)?\s?(%|percent|x\b)|\b\d{2,}\b/g) ?? [];
    const per100 = (numbers.length / wordCount) * 100;
    if (per100 >= 0.5) return [];

    return [
      {
        ruleId: 'aeo/no-statistics',
        severity: 'info',
        message: `Very few concrete figures (${numbers.length} in ${wordCount} words).`,
        fix:
          'Replace qualitative claims with specific numbers and cite their source. ' +
          'Statistics addition measured +25.9% visibility and citing sources +24.9% ' +
          'in the Princeton GEO benchmark — generative engines prefer claims they can verify.',
        location: { url: ctx.url },
      },
    ];
  },
});

export const noCitations = defineRule<PageContext>({
  id: 'aeo/no-outbound-citations',
  category: 'aeo',
  severity: 'info',
  needs: 'page',
  description: 'Citing authoritative sources raised visibility ~24.9% in the GEO study.',
  check(ctx) {
    const { links, wordCount } = extract(ctx.rawHtml);
    if (wordCount < 300) return [];

    let origin = '';
    try {
      origin = new URL(ctx.url).origin;
    } catch {
      /* relative or invalid URL — treat all absolute links as external */
    }

    const external = links.filter(
      (l) => /^https?:\/\//i.test(l.href) && (!origin || !l.href.startsWith(origin)),
    );

    if (external.length >= 3) return [];

    return [
      {
        ruleId: 'aeo/no-outbound-citations',
        severity: 'info',
        message: `Only ${external.length} outbound citations on a ${wordCount}-word page.`,
        fix:
          'Link inline to the primary sources behind your claims. This is one of the ' +
          'three highest-impact GEO tactics and costs nothing.',
        location: { url: ctx.url },
      },
    ];
  },
});

export const highPronounDensity = defineRule<PageContext>({
  id: 'aeo/high-pronoun-density',
  category: 'aeo',
  severity: 'info',
  needs: 'page',
  description:
    'Pronoun-heavy text loses meaning once a passage is extracted out of context.',
  check(ctx) {
    const { text, wordCount } = extract(ctx.rawHtml);
    if (wordCount < 200) return [];

    const pronouns = text.match(PRONOUN_RE) ?? [];
    const pct = (pronouns.length / wordCount) * 100;
    if (pct < 6) return [];

    return [
      {
        ruleId: 'aeo/high-pronoun-density',
        severity: 'info',
        message: `Pronoun density is ${pct.toFixed(1)}% (${pronouns.length} of ${wordCount} words).`,
        fix:
          'Replace pronouns with the actual entity names — "Perplexity" not "the platform", ' +
          '"INP" not "that metric". Retrieval strips surrounding context, so anaphoric ' +
          'references become meaningless in an extracted chunk.',
        location: { url: ctx.url },
      },
    ];
  },
});

export const longParagraphs = defineRule<PageContext>({
  id: 'aeo/long-paragraphs',
  category: 'aeo',
  severity: 'info',
  needs: 'page',
  description: 'Dense paragraphs do not chunk cleanly for passage retrieval.',
  check(ctx) {
    const html = ctx.rawHtml;
    const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) =>
      m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    );
    if (paragraphs.length < 3) return [];

    const long = paragraphs.filter((p) => p.split(/\s+/).length > 90);
    if (long.length / paragraphs.length < 0.3) return [];

    return [
      {
        ruleId: 'aeo/long-paragraphs',
        severity: 'info',
        message: `${long.length} of ${paragraphs.length} paragraphs exceed 90 words.`,
        fix:
          'Break into 2–4 line blocks, one idea each, so every block is an independently ' +
          'retrievable unit. Restructuring alone is reported to lift citation rates 2–4x.',
        location: { url: ctx.url },
      },
    ];
  },
});

export const noAnswerFirstOpening = defineRule<PageContext>({
  id: 'aeo/no-answer-first-opening',
  category: 'aeo',
  severity: 'info',
  needs: 'page',
  description:
    'The first 100 words are the primary citation target and should answer directly.',
  check(ctx) {
    const { text, wordCount } = extract(ctx.rawHtml);
    if (wordCount < 200) return [];

    const opening = text.split(/\s+/).slice(0, 60).join(' ');
    const hedges =
      /\b(in today's|in this article|we will|let's|welcome to|it depends|there are many|before we|first,? let)\b/i;

    if (!hedges.test(opening)) return [];

    return [
      {
        ruleId: 'aeo/no-answer-first-opening',
        severity: 'info',
        message: 'Opening reads as preamble rather than a direct answer.',
        fix:
          'Apply BLUFF — lead with a 40–60 word self-contained answer, then elaborate. ' +
          'The opening passage carries disproportionate weight in citation selection.',
        location: { url: ctx.url },
        evidence: { opening: opening.slice(0, 200) },
      },
    ];
  },
});

/** Minimum words before an extractability score means anything. */
export const MIN_SCORABLE_WORDS = 200;

export interface ExtractabilityResult {
  /** null when the page has too little content to score honestly. */
  score: number | null;
  applicable: boolean;
  reason?: string;
  breakdown: Record<string, boolean>;
}

/**
 * Composite 0–100 extractability score. Deliberately simple and transparent —
 * an opaque score nobody can reason about is worse than no score.
 *
 * Every AEO rule bails out below MIN_SCORABLE_WORDS, so a near-empty page
 * produces zero findings. Scoring that as 100/100 would be actively
 * misleading, so we return null instead.
 */
export function extractabilityScore(
  findings: Finding[],
  wordCount?: number,
): ExtractabilityResult {
  const checks = [
    'aeo/no-question-headings',
    'aeo/no-statistics',
    'aeo/no-outbound-citations',
    'aeo/high-pronoun-density',
    'aeo/long-paragraphs',
    'aeo/no-answer-first-opening',
  ];

  const breakdown: Record<string, boolean> = {};
  let passed = 0;
  for (const id of checks) {
    const ok = !findings.some((f) => f.ruleId === id);
    breakdown[id] = ok;
    if (ok) passed++;
  }

  if (wordCount !== undefined && wordCount < MIN_SCORABLE_WORDS) {
    return {
      score: null,
      applicable: false,
      reason: `Only ${wordCount} words of text — need at least ${MIN_SCORABLE_WORDS} to score meaningfully.`,
      breakdown,
    };
  }

  return {
    score: Math.round((passed / checks.length) * 100),
    applicable: true,
    breakdown,
  };
}

// ---------------------------------------------------------------------------
// AEO Depth: Chunk-level Suitability & Entity Density
// ---------------------------------------------------------------------------

export interface AeoChunk {
  heading: string;
  level: number;
  content: string;
}

export interface ChunkScore {
  wordCount: number;
  questionHead: boolean;
  bluffScore: number;
  pronounDensity: number;
  evidenceCount: number;
  suitabilityScore: number;
}

import * as cheerio from 'cheerio';

export function extractChunks(html: string): AeoChunk[] {
  const $ = cheerio.load(html);
  const chunks: AeoChunk[] = [];
  let currentChunk: any = null;

  $('body').find('*').each((_, el) => {
    const tagName = el.name;
    const isHeading = /^(h1|h2|h3|h4|h5|h6)$/i.test(tagName);

    if (isHeading) {
      if (currentChunk) {
        currentChunk.content = currentChunk.content.trim().replace(/\s+/g, ' ');
        chunks.push(currentChunk);
      }
      currentChunk = {
        heading: $(el).text().trim(),
        level: parseInt(tagName.substring(1), 10),
        content: '',
      };
    } else {
      if (currentChunk && el.children && el.children.length > 0) {
        const directText = $(el).contents().filter((_, child) => child.type === 'text').text().trim();
        if (directText) {
          currentChunk.content += ' ' + directText;
        }
      }
    }
  });

  if (currentChunk) {
    currentChunk.content = currentChunk.content.trim().replace(/\s+/g, ' ');
    chunks.push(currentChunk);
  }

  if (chunks.length === 0) {
    const bodyText = $('body').text().trim().replace(/\s+/g, ' ');
    if (bodyText) {
      chunks.push({
        heading: 'Introduction',
        level: 1,
        content: bodyText,
      });
    }
  }

  return chunks;
}

export function scoreChunk(chunk: AeoChunk): ChunkScore {
  const words = chunk.content.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const questionHead = chunk.heading.trim().endsWith('?') ||
    /^(how|what|why|when|where|which|who|can|should|is|are|does|do)\b/i.test(chunk.heading.trim());

  // BLUFF score: first sentence hedges search
  const sentences = chunk.content.split(/[.!?]+/);
  const firstSentence = (sentences[0] || '').trim();
  const hedges = /\b(in today's|in this article|we will|let's|welcome to|it depends|there are many)\b/i;
  const bluffScore = hedges.test(firstSentence) ? 40 : 100;

  const pronouns = chunk.content.match(PRONOUN_RE) ?? [];
  const pronounDensity = wordCount > 0 ? parseFloat(((pronouns.length / wordCount) * 100).toFixed(2)) : 0;

  const numbers = chunk.content.match(/\b\d+(\.\d+)?\s?(%|percent|x\b)|\b\d{2,}\b/g) ?? [];
  const evidenceCount = numbers.length;

  // Suitability calculation
  let suitabilityScore = 20; // baseline
  if (questionHead) suitabilityScore += 20;
  if (wordCount >= 100 && wordCount <= 250) suitabilityScore += 40;
  else if (wordCount >= 50 && wordCount < 100) suitabilityScore += 20;
  if (pronounDensity < 4) suitabilityScore += 20;

  return {
    wordCount,
    questionHead,
    bluffScore,
    pronounDensity,
    evidenceCount,
    suitabilityScore: Math.min(100, suitabilityScore),
  };
}

export function calculateEntityDensity(text: string): {
  nouns: string[];
  pronouns: string[];
  ratio: number;
  densityScore: number;
} {
  const pronouns = text.match(PRONOUN_RE) ?? [];
  const properNouns: string[] = [];

  const sentences = text.split(/[.!?]+/);
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;
    
    const words = trimmed.split(/\s+/);
    const candidateWords = words.slice(1);
    for (const w of candidateWords) {
      const clean = w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
      if (clean && /^[A-Z][a-z0-9]/.test(clean) && !PRONOUN_RE.test(clean)) {
        properNouns.push(clean);
      }
    }
  }

  const commonEntities = [
    'Google', 'ChatGPT', 'Gemini', 'Perplexity', 'SEO', 'AEO', 'GEO', 
    'SSR', 'INP', 'LCP', 'CLS', 'CWV', 'JSON-LD', 'Schema', 'HTML',
    'Nextjs', 'Next.js', 'Astro', 'Nuxt', 'SvelteKit', 'Remix'
  ];
  const words = text.split(/\s+/);
  for (const w of words) {
    const clean = w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
    if (commonEntities.includes(clean) || commonEntities.includes(w.trim())) {
      properNouns.push(clean);
    }
  }

  const uniqueNouns = Array.from(new Set(properNouns));
  const ratio = uniqueNouns.length / (pronouns.length + 1);

  let densityScore = 40;
  if (ratio >= 1.5) densityScore = 100;
  else if (ratio >= 0.8) densityScore = 70;

  return {
    nouns: uniqueNouns,
    pronouns,
    ratio: parseFloat(ratio.toFixed(2)),
    densityScore,
  };
}
