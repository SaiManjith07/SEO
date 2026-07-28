import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gradeEvidence } from './grade.js';
import { computeReward, computeActions, scoreDimension, WEIGHTS, toGrade } from './reward.js';
import { evaluate } from './evaluate.js';
import { BENCHMARKS } from './benchmarks.js';
import type { Check, DimensionId, DimensionScore, Evidence } from './types.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const GOOD_HTML = `<!doctype html><html lang="en"><head>
<title>How much does INP optimization cost?</title>
<link rel="canonical" href="https://example.com/inp-cost">
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Organization","name":"Example","url":"https://example.com",
 "sameAs":["https://x.com/example","https://github.com/example"]}
</script></head><body>
<h1>How much does INP optimization cost?</h1>
<p>Fixing INP costs 20 to 60 engineering hours. 43% of sites fail the 200ms threshold,
and 70% of that work is bundle reduction.</p>
<blockquote>"INP is the most commonly failed Core Web Vital," said the Chrome team.</blockquote>
<h2>What drives the cost?</h2>
<p>Long tasks over 50ms block the main thread. See the
<a href="https://web.dev/inp">web.dev guide</a>,
<a href="https://developer.chrome.com/docs/crux">CrUX docs</a> and
<a href="https://pagespeed.web.dev">PageSpeed Insights</a>.</p>
<h2>How long does measurement take?</h2>
<p>CrUX uses a 28-day rolling window at the 75th percentile, so allow 4 weeks before
judging any fix. Lab tools report a single synthetic run and routinely disagree with
field data. Only the field number affects ranking, which is why teams that optimise
Lighthouse scores in isolation often see no movement in Search Console at all.</p>
<h2>Which fixes give the largest return?</h2>
<p>Deferring third-party scripts recovers 80 to 150ms. Breaking long tasks with
scheduler.yield recovers another 40ms. Debouncing handlers and avoiding layout
thrashing closes most of the remaining gap for a typical marketing site.</p>
<img src="/a.png" alt="INP breakdown chart" width="800" height="400">
</body></html>`;

const SPA_SHELL = `<!doctype html><html><head><title>App</title></head>
<body><div id="root"></div><script src="/bundle.js"></script></body></html>`;

function evidence(html: string, over: Partial<Evidence> = {}): Evidence {
  return {
    url: 'https://example.com/inp-cost',
    finalUrl: 'https://example.com/inp-cost',
    status: 200,
    headers: {},
    rawHtml: html,
    robotsTxt: 'User-agent: *\nAllow: /\n',
    botAccess: {
      googlebot: { status: 200, wordCount: 300 },
      'oai-searchbot': { status: 200, wordCount: 300 },
      gptbot: { status: 200, wordCount: 300 },
      claudebot: { status: 200, wordCount: 300 },
      perplexitybot: { status: 200, wordCount: 300 },
    },
    crux: null,
    fetchedAt: '2026-07-27T00:00:00.000Z',
    ...over,
  };
}

function dimsFrom(checks: Check[]): Record<DimensionId, DimensionScore> {
  const d = {} as Record<DimensionId, DimensionScore>;
  for (const k of Object.keys(WEIGHTS) as DimensionId[]) d[k] = scoreDimension(k, checks);
  return d;
}

// ---------------------------------------------------------------------------

describe('independence from the builder', () => {
  // The critic's entire value rests on not sharing rules with @seokit/core.
  // If it did, it would agree with the builder by construction.
  it('never imports from @seokit/core', () => {
    // Must match real import/require syntax only. Doc comments that *mention*
    // the invariant are fine — an earlier version of this test flagged them.
    const IMPORT_RE =
      /(?:^|\n)\s*import\s[^;]*?from\s*['"]@seokit\/core['"]|require\(\s*['"]@seokit\/core['"]\s*\)|import\(\s*['"]@seokit\/core['"]\s*\)/;

    const offenders: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir)) {
        const p = join(dir, entry);
        if (statSync(p).isDirectory()) walk(p);
        // Skip test files: this file deliberately contains the import syntax
        // as a fixture in the meta-test below.
        else if (p.endsWith('.ts') && !p.endsWith('.test.ts')) {
          if (IMPORT_RE.test(readFileSync(p, 'utf8'))) offenders.push(p);
        }
      }
    };
    walk(import.meta.dirname);

    expect(offenders, `these files import the builder: ${offenders.join(', ')}`).toEqual([]);
  });

  it('the independence test actually detects a violation', () => {
    // Guard against the check silently passing because the regex is wrong.
    const IMPORT_RE =
      /(?:^|\n)\s*import\s[^;]*?from\s*['"]@seokit\/core['"]|require\(\s*['"]@seokit\/core['"]\s*\)|import\(\s*['"]@seokit\/core['"]\s*\)/;

    expect(IMPORT_RE.test(`import { runRules } from '@seokit/core';`)).toBe(true);
    expect(IMPORT_RE.test(`const x = require("@seokit/core");`)).toBe(true);
    expect(IMPORT_RE.test(`// never import from @seokit/core`)).toBe(false);
  });

  it('declares no dependency on @seokit/core', () => {
    const pkg = JSON.parse(
      readFileSync(join(import.meta.dirname, '..', 'package.json'), 'utf8'),
    );
    const deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies };
    expect(Object.keys(deps)).not.toContain('@seokit/core');
  });
});

describe('benchmark registry', () => {
  it('gives every benchmark a citable authority and source', () => {
    for (const b of BENCHMARKS) {
      expect(b.authority, b.id).toBeTruthy();
      expect(b.source, b.id).toMatch(/^https?:\/\//);
    }
  });

  it('has unique ids', () => {
    const ids = BENCHMARKS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('reward on a well-built page', () => {
  it('scores high and grades A or B', () => {
    const report = gradeEvidence(evidence(GOOD_HTML));
    expect(report.reward).toBeGreaterThan(0.85);
    expect(['A', 'B']).toContain(report.grade);
  });

  it('leaves performance unverified without CrUX data', () => {
    const report = gradeEvidence(evidence(GOOD_HTML));
    expect(report.dimensions.performance.verified).toBe(false);
    // Weight redistributed, so confidence drops below 1.
    expect(report.confidence).toBeCloseTo(0.8, 2);
  });
});

describe('gates are multiplicative and uncompensable', () => {
  it('zeroes the reward for a noindexed page, however good it otherwise is', () => {
    const report = gradeEvidence(
      evidence(GOOD_HTML, { headers: { 'x-robots-tag': 'noindex' } }),
    );
    expect(report.reward).toBe(0);
    expect(report.grade).toBe('F');
    expect(report.gates.find((g) => g.id === 'not-indexable')?.triggered).toBe(true);
  });

  it('applies the SPA-shell gate when AI crawlers see nothing', () => {
    const report = gradeEvidence(evidence(SPA_SHELL));
    const gate = report.gates.find((g) => g.id === 'spa-shell');
    expect(gate?.triggered).toBe(true);
    expect(report.reward).toBeLessThan(0.3);
  });

  it('halves the reward when retrieval bots are blocked', () => {
    const open = gradeEvidence(evidence(GOOD_HTML));
    const blocked = gradeEvidence(
      evidence(GOOD_HTML, {
        robotsTxt: 'User-agent: OAI-SearchBot\nDisallow: /\n',
      }),
    );
    expect(blocked.reward).toBeLessThan(open.reward);
    expect(
      blocked.gates.find((g) => g.id === 'retrieval-bots-blocked')?.triggered,
    ).toBe(true);
  });

  it('detects edge/WAF blocking that robots.txt would not reveal', () => {
    const report = gradeEvidence(
      evidence(GOOD_HTML, {
        botAccess: {
          googlebot: { status: 200, wordCount: 300 },
          gptbot: { status: 403, wordCount: 0 },
          'oai-searchbot': { status: 403, wordCount: 0 },
          claudebot: { status: 200, wordCount: 300 },
          perplexitybot: { status: 200, wordCount: 300 },
        },
      }),
    );
    const check = report.dimensions.ai_access.checks.find(
      (c) => c.benchmarkId === 'ai/bots-receive-200',
    );
    expect(check?.passed).toBe(false);
    expect(check?.fix).toMatch(/CDN or WAF/);
  });
});

describe('weights', () => {
  it('sum to 1.0', () => {
    const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1.0, 5);
  });

  it('renormalise over verified dimensions only', () => {
    const { checks } = evaluate(evidence(GOOD_HTML));
    const dims = dimsFrom(checks);
    const { effectiveWeights } = computeReward(dims, checks);
    const total = Object.values(effectiveWeights).reduce((a, b) => a + (b ?? 0), 0);
    expect(total).toBeCloseTo(1.0, 5);
    expect(effectiveWeights.performance).toBeUndefined();
  });
});

describe('expectedRewardGain is a real counterfactual', () => {
  it('matches the actual recomputed reward when a check is flipped', () => {
    const { checks } = evaluate(evidence(SPA_SHELL));
    const dims = dimsFrom(checks);
    const before = computeReward(dims, checks).reward;
    const actions = computeActions(dims, checks);

    const top = actions[0];
    const patched = checks.map((c) =>
      c.benchmarkId === top.benchmarkId ? { ...c, passed: true } : c,
    );
    const after = computeReward(dimsFrom(patched), patched).reward;

    expect(top.expectedRewardGain).toBeCloseTo(after - before, 3);
  });

  it('ranks the highest-impact fix first', () => {
    const report = gradeEvidence(evidence(SPA_SHELL));
    expect(report.actions.length).toBeGreaterThan(0);
    // Server-rendering releases the SPA gate, so it must dominate.
    expect(report.actions[0].dimension).toBe('ai_access');
    for (let i = 1; i < report.actions.length; i++) {
      expect(report.actions[i - 1].expectedRewardGain).toBeGreaterThanOrEqual(
        report.actions[i].expectedRewardGain,
      );
    }
  });

  it('gives every action a concrete remedy', () => {
    const report = gradeEvidence(evidence(SPA_SHELL));
    for (const a of report.actions) {
      expect(a.action, a.benchmarkId).toBeTruthy();
      expect(a.action.length).toBeGreaterThan(15);
    }
  });
});

describe('CrUX field data', () => {
  it('scores performance from real-user percentiles when present', () => {
    const report = gradeEvidence(
      evidence(GOOD_HTML, {
        crux: { lcpMs: 4100, inpMs: 350, cls: 0.02, source: 'crux-url' },
      }),
    );
    expect(report.dimensions.performance.verified).toBe(true);
    expect(report.dimensions.performance.score).toBeCloseTo(1 / 3, 2);
    expect(report.confidence).toBe(1);
  });

  it('reports the observed value, not just pass/fail', () => {
    const report = gradeEvidence(
      evidence(GOOD_HTML, {
        crux: { lcpMs: 4100, inpMs: 350, cls: 0.02, source: 'crux-url' },
      }),
    );
    const inp = report.dimensions.performance.checks.find(
      (c) => c.benchmarkId === 'perf/inp',
    );
    expect(inp?.observed).toContain('350ms');
    expect(inp?.expected).toContain('200ms');
  });
});

describe('grade boundaries', () => {
  it('maps rewards to letters', () => {
    expect(toGrade(0.95)).toBe('A');
    expect(toGrade(0.8)).toBe('B');
    expect(toGrade(0.65)).toBe('C');
    expect(toGrade(0.45)).toBe('D');
    expect(toGrade(0.1)).toBe('F');
  });
});
