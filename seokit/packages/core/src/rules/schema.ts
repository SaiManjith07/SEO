import { defineRule } from '../engine.js';
import { extract, flattenJsonLd, schemaTypes } from '../analyzers/extract.js';
import type { Finding, PageContext } from '../types.js';

export const noStructuredData = defineRule<PageContext>({
  id: 'schema/none-present',
  category: 'schema',
  severity: 'warning',
  needs: 'page',
  description: 'Page has no JSON-LD structured data.',
  docs: 'See 04-technical-requirements.md §3',
  check(ctx) {
    const { jsonLd } = extract(ctx.rawHtml);
    if (jsonLd.length > 0) return [];
    return [
      {
        ruleId: 'schema/none-present',
        severity: 'warning',
        message: 'No JSON-LD structured data found.',
        fix:
          'Add a <script type="application/ld+json"> block. Start with Organization ' +
          'site-wide and Article/Product on content pages. Around 65% of AI-cited ' +
          'pages carry structured data.',
        location: { url: ctx.url },
      },
    ];
  },
});

export const invalidJsonLd = defineRule<PageContext>({
  id: 'schema/invalid-json',
  category: 'schema',
  severity: 'error',
  needs: 'page',
  description: 'A JSON-LD block failed to parse.',
  check(ctx) {
    const { jsonLd } = extract(ctx.rawHtml);
    const broken = jsonLd.filter(
      (b) => b && typeof b === 'object' && '__parseError' in (b as object),
    );
    if (broken.length === 0) return [];
    return [
      {
        ruleId: 'schema/invalid-json',
        severity: 'error',
        message: `${broken.length} JSON-LD block(s) contain invalid JSON and are ignored entirely.`,
        fix: 'Fix the JSON syntax. Validate with the Google Rich Results Test. Trailing commas and unescaped quotes are the usual causes.',
        location: { url: ctx.url },
        evidence: broken,
      },
    ];
  },
});

export const missingOrganization = defineRule<PageContext>({
  id: 'schema/missing-organization',
  category: 'schema',
  severity: 'warning',
  needs: 'page',
  description: 'Organization schema establishes brand entity identity.',
  check(ctx) {
    const types = schemaTypes(extract(ctx.rawHtml).jsonLd);
    const hasOrg = [...types].some((t) =>
      ['Organization', 'Corporation', 'LocalBusiness', 'OnlineBusiness'].includes(t),
    );
    if (hasOrg) return [];
    return [
      {
        ruleId: 'schema/missing-organization',
        severity: 'warning',
        message: 'No Organization (or subtype) schema found.',
        fix:
          'Add Organization schema with name, url, logo and a complete sameAs array ' +
          'listing every authoritative profile you control. sameAs is the entity-' +
          'disambiguation signal AI systems use to decide whether a source is reliable.',
        location: { url: ctx.url },
      },
    ];
  },
});

export const organizationMissingSameAs = defineRule<PageContext>({
  id: 'schema/organization-missing-sameas',
  category: 'schema',
  severity: 'warning',
  needs: 'page',
  description: 'Organization schema without sameAs loses entity disambiguation.',
  check(ctx) {
    const nodes = flattenJsonLd(extract(ctx.rawHtml).jsonLd);
    const findings: Finding[] = [];
    for (const node of nodes) {
      const type = node['@type'];
      const isOrg =
        type === 'Organization' ||
        (Array.isArray(type) && type.includes('Organization'));
      if (!isOrg) continue;
      const sameAs = node['sameAs'];
      if (Array.isArray(sameAs) && sameAs.length >= 2) continue;
      findings.push({
        ruleId: 'schema/organization-missing-sameas',
        severity: 'warning',
        message: 'Organization schema has no meaningful sameAs array.',
        fix:
          'Add sameAs listing your LinkedIn, X, YouTube, GitHub and Wikipedia/Wikidata ' +
          'entries. This tells AI systems those profiles are the same entity as this site.',
        location: { url: ctx.url },
      });
    }
    return findings;
  },
});

export const contentParity = defineRule<PageContext>({
  id: 'schema/content-parity',
  category: 'schema',
  severity: 'error',
  needs: 'page',
  description:
    'FAQPage answers must appear in the visible page text (spammy structured data policy).',
  check(ctx) {
    const page = extract(ctx.rawHtml);
    const nodes = flattenJsonLd(page.jsonLd);
    const findings: Finding[] = [];
    const haystack = page.text.toLowerCase();

    for (const node of nodes) {
      if (node['@type'] !== 'FAQPage') continue;
      const entities = node['mainEntity'];
      if (!Array.isArray(entities)) continue;

      for (const q of entities as Record<string, unknown>[]) {
        const answer = q['acceptedAnswer'] as Record<string, unknown> | undefined;
        const text = typeof answer?.['text'] === 'string' ? answer['text'] : null;
        if (!text) continue;

        // Compare on a distinctive slice rather than the whole string, since
        // markup may differ from the plain-text answer.
        const probe = text
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 40)
          .toLowerCase();
        if (probe.length < 15) continue;

        if (!haystack.includes(probe)) {
          findings.push({
            ruleId: 'schema/content-parity',
            severity: 'error',
            message: `FAQ answer in schema is not visible on the page: "${probe}…"`,
            fix:
              'Render every FAQ question and answer in the visible page body. ' +
              'Marking up content a human cannot see violates Google\'s spammy ' +
              'structured data policy and risks a manual action.',
            location: { url: ctx.url },
          });
        }
      }
    }
    return findings;
  },
});
