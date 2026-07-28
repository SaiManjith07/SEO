import { defineRule } from '../engine.js';
import { extract } from '../analyzers/extract.js';
import type { Finding, PageContext } from '../types.js';

const D = 'https://developers.google.com/search/docs';

export const missingTitle = defineRule<PageContext>({
  id: 'html/missing-title',
  category: 'technical',
  severity: 'error',
  needs: 'page',
  description: 'Every indexable page must have a non-empty <title>.',
  docs: `${D}/appearance/title-link`,
  check(ctx) {
    const { title } = extract(ctx.rawHtml);
    if (title && title.length > 0) return [];
    return [
      {
        ruleId: 'html/missing-title',
        severity: 'error',
        message: 'Page has no <title> element (or it is empty).',
        fix: 'Add a unique, descriptive <title> of roughly 50–60 characters that includes the page\'s primary topic.',
        location: { url: ctx.url },
      },
    ];
  },
});

export const titleLength = defineRule<PageContext>({
  id: 'html/title-length',
  category: 'technical',
  severity: 'warning',
  needs: 'page',
  description: 'Titles longer than ~60 characters get truncated in results.',
  check(ctx) {
    const { title } = extract(ctx.rawHtml);
    if (!title) return [];
    if (title.length <= 60) return [];
    return [
      {
        ruleId: 'html/title-length',
        severity: 'warning',
        message: `Title is ${title.length} characters; it will likely be truncated.`,
        fix: 'Shorten to under 60 characters, front-loading the most important words.',
        location: { url: ctx.url },
        evidence: { title },
      },
    ];
  },
});

export const missingMetaDescription = defineRule<PageContext>({
  id: 'html/missing-meta-description',
  category: 'technical',
  severity: 'warning',
  needs: 'page',
  description: 'Meta descriptions influence click-through rate.',
  check(ctx) {
    const { metaDescription } = extract(ctx.rawHtml);
    if (metaDescription) return [];
    return [
      {
        ruleId: 'html/missing-meta-description',
        severity: 'warning',
        message: 'Page has no meta description.',
        fix: 'Add <meta name="description" content="..."> of 120–160 characters describing what the page answers.',
        location: { url: ctx.url },
      },
    ];
  },
});

export const missingH1 = defineRule<PageContext>({
  id: 'html/missing-h1',
  category: 'technical',
  severity: 'error',
  needs: 'page',
  description: 'Exactly one <h1> per page, in real heading markup.',
  check(ctx) {
    const { h1s } = extract(ctx.rawHtml);
    if (h1s.length === 1 && h1s[0].length > 0) return [];
    if (h1s.length === 0) {
      return [
        {
          ruleId: 'html/missing-h1',
          severity: 'error',
          message: 'Page has no <h1>.',
          fix: 'Add a single <h1> stating the page topic. It must be a real <h1> tag, not a styled <div> — models parse HTML structure to find chunk boundaries.',
          location: { url: ctx.url },
        },
      ];
    }
    return [
      {
        ruleId: 'html/missing-h1',
        severity: 'error',
        message: `Page has ${h1s.length} <h1> elements; expected exactly 1.`,
        fix: 'Keep one <h1> and demote the rest to <h2>.',
        location: { url: ctx.url },
        evidence: { h1s },
      },
    ];
  },
});

export const headingOrder = defineRule<PageContext>({
  id: 'html/heading-order',
  category: 'technical',
  severity: 'warning',
  needs: 'page',
  description: 'Heading levels must not skip (h2 -> h4).',
  check(ctx) {
    const { headings } = extract(ctx.rawHtml);
    const findings: Finding[] = [];
    let prev = 0;
    for (const h of headings) {
      if (prev !== 0 && h.level > prev + 1) {
        findings.push({
          ruleId: 'html/heading-order',
          severity: 'warning',
          message: `Heading level jumps from h${prev} to h${h.level}: "${h.text.slice(0, 60)}"`,
          fix: `Change this heading to h${prev + 1}, or add the intermediate level.`,
          location: { url: ctx.url },
        });
      }
      prev = h.level;
    }
    return findings;
  },
});

export const missingCanonical = defineRule<PageContext>({
  id: 'html/missing-canonical',
  category: 'technical',
  severity: 'warning',
  needs: 'page',
  description: 'Every page should declare a self-referencing canonical.',
  check(ctx) {
    const { canonical } = extract(ctx.rawHtml);
    if (canonical) return [];
    return [
      {
        ruleId: 'html/missing-canonical',
        severity: 'warning',
        message: 'No <link rel="canonical"> found.',
        fix: 'Add a self-referencing absolute canonical URL to prevent duplicate-content ambiguity.',
        location: { url: ctx.url },
      },
    ];
  },
});

export const imagesMissingAlt = defineRule<PageContext>({
  id: 'html/images-missing-alt',
  category: 'content',
  severity: 'warning',
  needs: 'page',
  description: 'Meaningful images need descriptive alt text.',
  check(ctx) {
    const { images } = extract(ctx.rawHtml);
    const missing = images.filter((i) => i.alt === null);
    if (missing.length === 0) return [];
    return [
      {
        ruleId: 'html/images-missing-alt',
        severity: 'warning',
        message: `${missing.length} of ${images.length} images have no alt attribute.`,
        fix: 'Add descriptive alt text. Use alt="" only for decorative images, so screen readers and crawlers skip them deliberately.',
        location: { url: ctx.url },
        evidence: { sources: missing.slice(0, 10).map((i) => i.src) },
      },
    ];
  },
});

export const imagesMissingDimensions = defineRule<PageContext>({
  id: 'html/images-missing-dimensions',
  category: 'performance',
  severity: 'warning',
  needs: 'page',
  description: 'Images without width/height cause layout shift (CLS).',
  check(ctx) {
    const { images } = extract(ctx.rawHtml);
    const missing = images.filter((i) => !i.width || !i.height);
    if (missing.length === 0) return [];
    return [
      {
        ruleId: 'html/images-missing-dimensions',
        severity: 'warning',
        message: `${missing.length} images lack explicit width/height.`,
        fix: 'Set width and height attributes (or CSS aspect-ratio) so the browser reserves space. This is the most common cause of failing CLS.',
        location: { url: ctx.url },
      },
    ];
  },
});

export const missingLang = defineRule<PageContext>({
  id: 'html/missing-lang',
  category: 'technical',
  severity: 'warning',
  needs: 'page',
  description: '<html> must declare a lang attribute.',
  check(ctx) {
    const { lang } = extract(ctx.rawHtml);
    if (lang) return [];
    return [
      {
        ruleId: 'html/missing-lang',
        severity: 'warning',
        message: '<html> has no lang attribute.',
        fix: 'Add lang="en" (or the correct BCP-47 code) to the <html> element.',
        location: { url: ctx.url },
      },
    ];
  },
});

export const noindexPresent = defineRule<PageContext>({
  id: 'html/noindex-present',
  category: 'technical',
  severity: 'error',
  needs: 'page',
  description: 'Flags accidental noindex on a page you are auditing.',
  check(ctx) {
    const { robotsMeta } = extract(ctx.rawHtml);
    const header = ctx.headers['x-robots-tag'];
    const sources: string[] = [];
    if (robotsMeta && /noindex/i.test(robotsMeta)) sources.push(`meta robots: "${robotsMeta}"`);
    if (header && /noindex/i.test(header)) sources.push(`X-Robots-Tag: "${header}"`);
    if (sources.length === 0) return [];
    return [
      {
        ruleId: 'html/noindex-present',
        severity: 'error',
        message: `Page is set to noindex (${sources.join('; ')}). It cannot rank or be cited.`,
        fix: 'Remove the noindex directive if this page should be indexed. This is frequently left over from a staging environment.',
        location: { url: ctx.url },
      },
    ];
  },
});
