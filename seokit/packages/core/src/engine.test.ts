import { describe, it, expect } from 'vitest';
import { runRules, extract, extractabilityScore } from './index.js';
import type { PageContext } from './types.js';

function page(html: string, overrides: Partial<PageContext> = {}): PageContext {
  return {
    kind: 'page',
    url: 'https://example.com/test',
    status: 200,
    headers: {},
    rawHtml: html,
    ...overrides,
  };
}

const GOOD = `<!doctype html>
<html lang="en">
<head>
  <title>How much does INP optimization cost?</title>
  <meta name="description" content="A direct answer on the cost of fixing Interaction to Next Paint, with real figures from three projects.">
  <link rel="canonical" href="https://example.com/test">
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"Organization","name":"Example",
   "url":"https://example.com","sameAs":["https://x.com/example","https://github.com/example"]}
  </script>
</head>
<body>
  <h1>How much does INP optimization cost?</h1>
  <p>Fixing Interaction to Next Paint costs 20 to 60 engineering hours for a typical
     site. 43% of sites fail the 200ms threshold, and most failures trace to
     third-party scripts rather than application code.</p>

  <h2>What drives the cost?</h2>
  <p>Bundle size drives roughly 70% of the work. Long tasks over 50ms block the
     main thread and delay paint.</p>
  <p>Analytics tags, chat widgets and tag managers are the three most common
     offenders. See the <a href="https://web.dev/inp">web.dev INP guide</a> and the
     <a href="https://developer.chrome.com/docs/crux">CrUX documentation</a> for
     measurement detail.</p>

  <h2>How long does measurement take?</h2>
  <p>CrUX uses a 28-day rolling window at the 75th percentile, so allow 4 weeks
     minimum before judging any fix.</p>
  <p>Lab tools report a single synthetic run and will disagree with field data.
     The <a href="https://pagespeed.web.dev">PageSpeed Insights</a> report shows
     both, and only the field number affects ranking.</p>

  <h2>Which fixes give the largest return?</h2>
  <p>Deferring non-critical third-party scripts typically recovers 80 to 150ms
     on its own. Breaking long tasks with scheduler.yield recovers another 40ms.</p>
  <p>Debouncing expensive event handlers and avoiding layout thrashing close most
     remaining gaps. Teams that ship these 4 changes usually move from 350ms to
     under 200ms within a single sprint.</p>

  <h2>Is INP worth prioritising over LCP?</h2>
  <p>Prioritise INP when the site is interactive and LCP already passes. Since the
     March 2026 core update aggregated all 3 vitals into a site-wide composite,
     a single failing metric now drags the whole score.</p>

  <img src="/a.png" alt="INP breakdown chart showing main thread blocking by script source" width="800" height="400">
</body></html>`;

const BAD = `<!doctype html>
<html>
<head><script type="application/ld+json">{ broken json,, }</script></head>
<body>
  <div id="root"></div>
</body></html>`;

describe('extract', () => {
  it('pulls the fields rules depend on', () => {
    const r = extract(GOOD);
    expect(r.title).toBe('How much does INP optimization cost?');
    expect(r.h1s).toHaveLength(1);
    expect(r.lang).toBe('en');
    expect(r.jsonLd).toHaveLength(1);
    expect(r.images[0].alt).toMatch(/^INP breakdown chart/);
    expect(r.wordCount).toBeGreaterThan(200);
  });
});

describe('runRules on a well-built page', () => {
  it('reports no errors', () => {
    const { findings, stats } = runRules(page(GOOD));
    const errors = findings.filter((f) => f.severity === 'error');
    expect(errors).toEqual([]);
    expect(stats.rulesRun).toBeGreaterThan(10);
  });

  it('scores high on extractability', () => {
    const { findings } = runRules(page(GOOD));
    const wc = extract(GOOD).wordCount;
    const r = extractabilityScore(findings, wc);
    expect(r.applicable).toBe(true);
    expect(r.score).toBeGreaterThanOrEqual(80);
  });
});

describe('extractability scoring honesty', () => {
  // Regression: an empty page produces no AEO findings (every AEO rule bails
  // out on short content), which naively scored as a perfect 100/100.
  it('refuses to score a page with too little content', () => {
    const { findings } = runRules(page(BAD));
    const r = extractabilityScore(findings, extract(BAD).wordCount);
    expect(r.applicable).toBe(false);
    expect(r.score).toBeNull();
    expect(r.reason).toMatch(/at least 200/);
  });

  it('still scores when called without a word count (back-compat)', () => {
    const { findings } = runRules(page(GOOD));
    expect(extractabilityScore(findings).applicable).toBe(true);
  });
});

describe('runRules on a broken page', () => {
  it('catches missing title, h1 and invalid JSON-LD', () => {
    const { findings } = runRules(page(BAD));
    const ids = findings.map((f) => f.ruleId);
    expect(ids).toContain('html/missing-title');
    expect(ids).toContain('html/missing-h1');
    expect(ids).toContain('schema/invalid-json');
    expect(ids).toContain('ai-access/empty-server-response');
  });

  it('gives every finding an actionable fix', () => {
    const { findings } = runRules(page(BAD));
    const errors = findings.filter((f) => f.severity === 'error');
    expect(errors.length).toBeGreaterThan(0);
    for (const f of errors) expect(f.fix, `${f.ruleId} has no fix`).toBeTruthy();
  });
});

describe('the differentiator: CSR vs SSR diff', () => {
  it('flags content that only exists after JavaScript runs', () => {
    const ctx = page('<html><body><div id="root"></div></body></html>', {
      renderedHtml: GOOD,
    });
    const { findings } = runRules(ctx);
    const ids = findings.map((f) => f.ruleId);
    expect(ids).toContain('ai-access/client-side-only-content');

    const f = findings.find((x) => x.ruleId === 'ai-access/client-side-only-content');
    expect(f?.message).toMatch(/GPTBot|missing from the server response/);
  });

  it('stays quiet when raw and rendered match', () => {
    const ctx = page(GOOD, { renderedHtml: GOOD });
    const { findings } = runRules(ctx);
    expect(
      findings.filter((f) => f.ruleId === 'ai-access/client-side-only-content'),
    ).toEqual([]);
  });
});

describe('noindex detection', () => {
  it('catches X-Robots-Tag headers, not just meta tags', () => {
    const ctx = page(GOOD, { headers: { 'x-robots-tag': 'noindex, nofollow' } });
    const { findings } = runRules(ctx);
    expect(findings.map((f) => f.ruleId)).toContain('html/noindex-present');
  });
});

describe('config overrides', () => {
  it('honours rule severity set to off', () => {
    const { findings } = runRules(page(BAD), {
      rules: { 'html/missing-title': 'off' },
    });
    expect(findings.map((f) => f.ruleId)).not.toContain('html/missing-title');
  });

  it('honours severity downgrades', () => {
    const { findings } = runRules(page(BAD), {
      rules: { 'html/missing-h1': 'warning' },
    });
    const f = findings.find((x) => x.ruleId === 'html/missing-h1');
    expect(f?.severity).toBe('warning');
  });
});
