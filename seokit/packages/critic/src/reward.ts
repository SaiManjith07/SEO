import type {
  Action,
  Check,
  DimensionId,
  DimensionScore,
  Gate,
} from './types.js';

/**
 * Dimension weights. Sum to 1.0 over all dimensions; renormalised at runtime
 * across whichever dimensions could actually be verified, so an unmeasurable
 * dimension neither helps nor hurts.
 */
export const WEIGHTS: Record<DimensionId, number> = {
  indexability: 0.2,
  ai_access: 0.2,
  performance: 0.2,
  structured_data: 0.15,
  content_quality: 0.15,
  semantics: 0.1,
};

/**
 * Gates are MULTIPLICATIVE, deliberately.
 *
 * An additive penalty would let a site compensate for being unindexable by
 * polishing everything else — precisely the failure a critic exists to
 * prevent. Multiplication makes certain failures uncompensable, which
 * matches how search actually behaves.
 */
export const GATE_DEFINITIONS = [
  {
    id: 'not-indexable',
    multiplier: 0,
    message:
      'Page cannot be indexed (noindex, non-200 status, or robots.txt block). ' +
      'Nothing else can compensate — reward is zero by construction.',
    triggers: (checks: Check[]): boolean =>
      checks.some(
        (c) =>
          !c.passed &&
          ['index/http-ok', 'index/no-noindex', 'index/googlebot-allowed'].includes(
            c.benchmarkId,
          ),
      ),
  },
  {
    id: 'spa-shell',
    multiplier: 0.25,
    message:
      'Raw HTML contains almost no text. GPTBot, ClaudeBot and PerplexityBot ' +
      'do not execute JavaScript, so they see an effectively empty page.',
    triggers: (checks: Check[]): boolean =>
      checks.some((c) => !c.passed && c.benchmarkId === 'ai/content-in-raw-html'),
  },
  {
    id: 'retrieval-bots-blocked',
    multiplier: 0.5,
    message:
      'robots.txt blocks AI retrieval bots. The site has voluntarily removed ' +
      'itself from AI answers.',
    triggers: (checks: Check[]): boolean =>
      checks.some(
        (c) => !c.passed && c.benchmarkId === 'ai/retrieval-bots-allowed',
      ),
  },
  {
    id: 'invalid-schema',
    multiplier: 0.9,
    message: 'A JSON-LD block failed to parse, so the entire block is ignored.',
    triggers: (checks: Check[]): boolean =>
      checks.some((c) => !c.passed && c.benchmarkId === 'schema/valid-json'),
  },
] as const;

export interface RewardBreakdown {
  reward: number;
  base: number;
  gateMultiplier: number;
  gates: Gate[];
  confidence: number;
  /** Weights after renormalising over verified dimensions */
  effectiveWeights: Partial<Record<DimensionId, number>>;
}

/** Score a dimension as the fraction of its checks that passed. */
export function scoreDimension(
  dimension: DimensionId,
  checks: Check[],
): DimensionScore {
  const own = checks.filter((c) => c.dimension === dimension);

  if (own.length === 0) {
    return {
      dimension,
      score: null,
      verified: false,
      reason: 'No evidence available for this dimension.',
      checks: [],
    };
  }

  const passed = own.filter((c) => c.passed).length;
  return {
    dimension,
    score: passed / own.length,
    verified: true,
    checks: own,
  };
}

/**
 * The reward function.
 *
 *   reward = gate_multiplier × Σ (renormalised_weightᵢ × scoreᵢ)
 */
export function computeReward(
  dimensions: Record<DimensionId, DimensionScore>,
  allChecks: Check[],
): RewardBreakdown {
  const verified = (Object.keys(WEIGHTS) as DimensionId[]).filter(
    (d) => dimensions[d]?.verified && dimensions[d]?.score !== null,
  );

  // Renormalise so unverifiable dimensions neither help nor hurt.
  const totalWeight = verified.reduce((sum, d) => sum + WEIGHTS[d], 0);
  const effectiveWeights: Partial<Record<DimensionId, number>> = {};

  let base = 0;
  for (const d of verified) {
    const w = totalWeight > 0 ? WEIGHTS[d] / totalWeight : 0;
    effectiveWeights[d] = w;
    base += w * (dimensions[d].score ?? 0);
  }

  const gates: Gate[] = GATE_DEFINITIONS.map((g) => ({
    id: g.id,
    multiplier: g.multiplier,
    triggered: g.triggers(allChecks),
    message: g.message,
  }));

  const gateMultiplier = gates
    .filter((g) => g.triggered)
    .reduce((m, g) => m * g.multiplier, 1);

  // Confidence reflects how much of the intended weight we actually measured.
  const confidence = totalWeight;

  return {
    reward: round(base * gateMultiplier),
    base: round(base),
    gateMultiplier: round(gateMultiplier),
    gates,
    confidence: round(confidence),
    effectiveWeights,
  };
}

export function toGrade(reward: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (reward >= 0.9) return 'A';
  if (reward >= 0.75) return 'B';
  if (reward >= 0.6) return 'C';
  if (reward >= 0.4) return 'D';
  return 'F';
}

/**
 * Build the prioritised action queue.
 *
 * `expectedRewardGain` is a genuine counterfactual: flip one failing check to
 * passing, recompute the whole reward, report the delta. Not a heuristic.
 * This is what turns a grade into a work queue the builder MCP can consume.
 */
export function computeActions(
  dimensions: Record<DimensionId, DimensionScore>,
  allChecks: Check[],
): Action[] {
  const current = computeReward(dimensions, allChecks).reward;
  const failing = allChecks.filter((c) => !c.passed);
  const actions: Action[] = [];

  for (const check of failing) {
    const patchedChecks = allChecks.map((c) =>
      c.benchmarkId === check.benchmarkId ? { ...c, passed: true } : c,
    );

    const patchedDims = {} as Record<DimensionId, DimensionScore>;
    for (const d of Object.keys(WEIGHTS) as DimensionId[]) {
      patchedDims[d] = dimensions[d]?.verified
        ? scoreDimension(d, patchedChecks)
        : dimensions[d];
    }

    const gain = computeReward(patchedDims, patchedChecks).reward - current;

    actions.push({
      action: check.fix ?? `Meet benchmark ${check.benchmarkId}`,
      dimension: check.dimension,
      benchmarkId: check.benchmarkId,
      expectedRewardGain: round(gain),
    });
  }

  return actions.sort((a, b) => b.expectedRewardGain - a.expectedRewardGain);
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}
