#!/usr/bin/env node
/**
 * @seokit/critic-mcp — the second MCP server.
 *
 * Grades a live site against published external benchmarks and emits a reward
 * signal the builder MCP (seokit) consumes. Deliberately shares no rules with
 * the builder — see 09-critic-architecture.md.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  BENCHMARKS,
  WEIGHTS,
  GATE_DEFINITIONS,
  grade,
  compareReports,
  getBenchmark,
  type CriticReport,
} from '@seokit/critic';

const server = new McpServer({ name: 'seokit-critic', version: '0.1.0' });

const CRUX_KEY = process.env.CRUX_API_KEY;
const text = (s: string) => ({ content: [{ type: 'text' as const, text: s }] });

/** In-memory history so critic_compare works without a database. */
const history = new Map<string, CriticReport>();

/**
 * Network failures are the most common way this tool fails. A bare
 * "fetch failed" is useless to an agent, so surface the likely causes.
 */
function networkError(url: string, err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  return [
    `Could not grade ${url}`,
    `Reason: ${msg}`,
    '',
    'Likely causes:',
    '  - The host is unreachable, or DNS failed',
    '  - The request timed out (default 20s)',
    '  - An egress firewall or proxy is blocking outbound requests',
    '  - The URL requires authentication',
    '',
    'The critic grades live URLs only — it cannot grade localhost from a',
    'remote environment, or a page behind a login.',
  ].join('\n');
}

function renderReport(r: CriticReport): string {
  const lines: string[] = [
    `# Critic report — ${r.url}`,
    '',
    `REWARD: ${r.reward.toFixed(3)}   GRADE: ${r.grade}   CONFIDENCE: ${r.confidence.toFixed(2)}`,
    '',
  ];

  if (r.delta) {
    const sign = r.delta.change >= 0 ? '+' : '';
    lines.push(
      `## Change since last grade`,
      `  previous ${r.delta.previousReward.toFixed(3)} -> ${r.reward.toFixed(3)}  (${sign}${r.delta.change.toFixed(3)})`,
    );
    if (r.delta.improvements.length)
      lines.push(`  fixed:      ${r.delta.improvements.join(', ')}`);
    if (r.delta.regressions.length)
      lines.push(`  REGRESSED:  ${r.delta.regressions.join(', ')}`);
    lines.push('');
  }

  lines.push('## Dimensions');
  for (const [id, d] of Object.entries(r.dimensions)) {
    const w = WEIGHTS[id as keyof typeof WEIGHTS];
    if (!d.verified) {
      lines.push(`  ${id.padEnd(17)} unverified  (weight ${w} redistributed) — ${d.reason ?? ''}`);
      continue;
    }
    const pct = ((d.score ?? 0) * 100).toFixed(0).padStart(3);
    const passed = d.checks.filter((c) => c.passed).length;
    lines.push(`  ${id.padEnd(17)} ${pct}%  (${passed}/${d.checks.length} checks, weight ${w})`);
  }

  const triggered = r.gates.filter((g) => g.triggered);
  if (triggered.length) {
    lines.push('', '## Gates triggered (multiplicative)');
    for (const g of triggered) {
      lines.push(`  x${g.multiplier}  ${g.id}`);
      lines.push(`         ${g.message}`);
    }
  }

  const failed = Object.values(r.dimensions)
    .flatMap((d) => d.checks)
    .filter((c) => !c.passed);

  if (failed.length) {
    lines.push('', '## Failed benchmarks');
    for (const c of failed) {
      const b = getBenchmark(c.benchmarkId);
      lines.push(`  [FAIL] ${c.benchmarkId}`);
      lines.push(`         observed: ${c.observed}`);
      lines.push(`         expected: ${c.expected}`);
      if (b) lines.push(`         authority: ${b.authority}`);
    }
  }

  if (r.actions.length) {
    lines.push('', '## Prioritised actions (by actual reward gain)');
    for (const a of r.actions.slice(0, 10)) {
      lines.push(`  +${a.expectedRewardGain.toFixed(3)}  [${a.dimension}] ${a.action}`);
    }
  } else {
    lines.push('', 'All benchmarks passed.');
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------

server.registerTool(
  'critic_grade_url',
  {
    title: 'Grade a URL against external benchmarks',
    description:
      'Independently grade a live URL against published benchmarks (Core Web ' +
      'Vitals, Google Search Essentials, schema.org, WCAG, the Princeton GEO ' +
      'paper). Returns a reward score 0-1, per-dimension breakdown, triggered ' +
      'gates, and a prioritised action list ranked by actual reward gain. Use ' +
      'this to verify work rather than trusting a builder tool\'s own report.',
    inputSchema: {
      url: z.string().url().describe('Absolute URL to grade'),
      json: z
        .boolean()
        .default(false)
        .describe('Return raw JSON for machine consumption instead of a formatted report'),
    },
  },
  async ({ url, json }) => {
    let report: CriticReport;
    try {
      report = await grade(url, { cruxApiKey: CRUX_KEY });
    } catch (err) {
      return text(networkError(url, err));
    }

    const previous = history.get(url);
    if (previous) report = compareReports(previous, report);
    history.set(url, report);

    return text(json ? JSON.stringify(report, null, 2) : renderReport(report));
  },
);

server.registerTool(
  'critic_verify_claim',
  {
    title: 'Verify a claim made by the builder',
    description:
      'The builder asserts it fixed something; this independently confirms or ' +
      'refutes it against the live URL. Use when a build tool reports success — ' +
      'a tool should not mark its own homework.',
    inputSchema: {
      url: z.string().url(),
      benchmarkId: z
        .string()
        .describe('Benchmark to verify, e.g. ai/content-in-raw-html'),
    },
  },
  async ({ url, benchmarkId }) => {
    const benchmark = getBenchmark(benchmarkId);
    if (!benchmark) {
      return text(
        `Unknown benchmark: ${benchmarkId}\n\nAvailable:\n${BENCHMARKS.map(
          (b) => `  ${b.id}`,
        ).join('\n')}`,
      );
    }

    let report: CriticReport;
    try {
      report = await grade(url, { cruxApiKey: CRUX_KEY });
    } catch (err) {
      return text(networkError(url, err));
    }

    const check = Object.values(report.dimensions)
      .flatMap((d) => d.checks)
      .find((c) => c.benchmarkId === benchmarkId);

    if (!check) {
      return text(
        `VERDICT: UNVERIFIABLE\n\n${benchmarkId} could not be evaluated for ${url}.\n` +
          `Dimension "${benchmark.dimension}" has no evidence available.`,
      );
    }

    return text(
      [
        `VERDICT: ${check.passed ? 'CONFIRMED' : 'REFUTED'}`,
        '',
        `Benchmark: ${benchmarkId}`,
        `Threshold: ${benchmark.threshold}`,
        `Authority: ${benchmark.authority}`,
        `Source:    ${benchmark.source}`,
        '',
        `Observed:  ${check.observed}`,
        `Expected:  ${check.expected}`,
        check.passed ? '' : `\nStill needs: ${check.fix ?? 'see benchmark'}`,
      ].join('\n'),
    );
  },
);

server.registerTool(
  'critic_compare',
  {
    title: 'Compare two URLs or two points in time',
    description:
      'Compare reward between two URLs, or re-grade one URL against its last ' +
      'recorded grade. Names regressions explicitly rather than burying them ' +
      'in a score change.',
    inputSchema: {
      url: z.string().url().describe('URL to grade'),
      against: z
        .string()
        .url()
        .optional()
        .describe('Optional second URL; omit to compare against this URL\'s previous grade'),
    },
  },
  async ({ url, against }) => {
    let current: CriticReport;
    let baseline: CriticReport | undefined;
    try {
      current = await grade(url, { cruxApiKey: CRUX_KEY });
      baseline = against
        ? await grade(against, { cruxApiKey: CRUX_KEY })
        : history.get(url);
    } catch (err) {
      return text(networkError(against ?? url, err));
    }

    if (!baseline) {
      history.set(url, current);
      return text(
        `No baseline available for ${url}. Recorded this grade (${current.reward.toFixed(3)}) as the baseline — run again after making changes.`,
      );
    }

    const compared = compareReports(baseline, current);
    history.set(url, current);

    return text(
      [
        against ? `Comparing ${url} against ${against}` : `Comparing ${url} against its previous grade`,
        '',
        renderReport(compared),
      ].join('\n'),
    );
  },
);

server.registerTool(
  'critic_benchmarks',
  {
    title: 'List all benchmarks',
    description:
      'List every benchmark used for grading, with its threshold and the ' +
      'authority that published it. The grading is auditable, not a black box.',
    inputSchema: {
      dimension: z
        .enum([
          'indexability',
          'ai_access',
          'performance',
          'structured_data',
          'content_quality',
          'semantics',
        ])
        .optional(),
    },
  },
  async ({ dimension }) => {
    const list = BENCHMARKS.filter((b) => !dimension || b.dimension === dimension);
    return text(
      [
        `${list.length} benchmarks`,
        '',
        ...list.flatMap((b) => [
          `${b.id}   [${b.dimension}]`,
          `  threshold: ${b.threshold}`,
          `  authority: ${b.authority}`,
          `  source:    ${b.source}`,
          '',
        ]),
      ].join('\n'),
    );
  },
);

server.registerTool(
  'critic_explain_reward',
  {
    title: 'Explain the reward arithmetic',
    description:
      'Show exactly how the reward is computed: dimension weights, ' +
      'multiplicative gates, and renormalisation over verified dimensions.',
    inputSchema: {},
  },
  async () =>
    text(
      [
        '# Reward function',
        '',
        '  reward = gate_multiplier x SUM( renormalised_weight_i x score_i )',
        '',
        '## Dimension weights',
        ...Object.entries(WEIGHTS).map(([d, w]) => `  ${d.padEnd(17)} ${w}`),
        '',
        'Weights renormalise across dimensions that could actually be verified,',
        'so an unmeasurable dimension neither helps nor hurts. Confidence reports',
        'how much of the intended weight was measured.',
        '',
        '## Gates (multiplicative)',
        ...GATE_DEFINITIONS.map((g) => `  x${g.multiplier}  ${g.id}\n         ${g.message}`),
        '',
        'Gates multiply rather than subtract. An additive penalty would let a site',
        'compensate for being unindexable by polishing everything else — exactly the',
        'failure a critic exists to prevent.',
        '',
        '## Grades',
        '  A >= 0.90    B >= 0.75    C >= 0.60    D >= 0.40    F < 0.40',
        '',
        '## Known limitation',
        'Four of six dimensions are computed from HTML the builder controls, so the',
        'reward is gameable by an agent optimising for it. CrUX field data (performance)',
        'is the exception — it is measured on real users and cannot be faked from markup.',
        'Treat the reward as a floor, not a ceiling: a low score reliably means something',
        'is wrong; a high score only means nothing obvious is wrong. No automated critic',
        'can judge whether content is actually useful to a human.',
      ].join('\n'),
    ),
);

// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  await server.connect(new StdioServerTransport());
  console.error(
    `seokit-critic MCP running on stdio${CRUX_KEY ? ' (CrUX enabled)' : ' (no CRUX_API_KEY — performance unverified)'}`,
  );
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
