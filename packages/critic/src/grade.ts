import type { CriticReport, Evidence } from './types.js';
import { collectEvidence, type CollectOptions } from './evidence/collect.js';
import { evaluate } from './evaluate.js';
import { computeActions, computeReward, toGrade } from './reward.js';

/** Grade a live URL end to end: collect evidence, evaluate, reward, prioritise. */
export async function grade(
  url: string,
  opts: CollectOptions = {},
): Promise<CriticReport> {
  const evidence = await collectEvidence(url, opts);
  return gradeEvidence(evidence);
}

/** Grade pre-collected evidence. Separated so it is testable without network. */
export function gradeEvidence(evidence: Evidence): CriticReport {
  const { checks, dimensions } = evaluate(evidence);
  const breakdown = computeReward(dimensions, checks);
  const actions = computeActions(dimensions, checks);

  return {
    url: evidence.finalUrl || evidence.url,
    gradedAt: evidence.fetchedAt,
    reward: breakdown.reward,
    grade: toGrade(breakdown.reward),
    confidence: breakdown.confidence,
    dimensions,
    gates: breakdown.gates,
    actions,
  };
}

/**
 * Compare two reports. This is how the builder MCP learns whether its last
 * change helped — regressions are named explicitly rather than buried in a
 * score change.
 */
export function compareReports(
  previous: CriticReport,
  current: CriticReport,
): CriticReport {
  const regressions: string[] = [];
  const improvements: string[] = [];

  const prevFailed = new Set(
    Object.values(previous.dimensions)
      .flatMap((d) => d.checks)
      .filter((c) => !c.passed)
      .map((c) => c.benchmarkId),
  );
  const currFailed = new Set(
    Object.values(current.dimensions)
      .flatMap((d) => d.checks)
      .filter((c) => !c.passed)
      .map((c) => c.benchmarkId),
  );

  for (const id of currFailed) if (!prevFailed.has(id)) regressions.push(id);
  for (const id of prevFailed) if (!currFailed.has(id)) improvements.push(id);

  return {
    ...current,
    delta: {
      previousReward: previous.reward,
      change: Math.round((current.reward - previous.reward) * 1000) / 1000,
      regressions,
      improvements,
    },
  };
}
