/**
 * @seokit/critic — independent verification against published benchmarks.
 *
 * INVARIANT: this package must never import from @seokit/core. The critic's
 * value comes entirely from reasoning about different evidence than the
 * builder. A test in reward.test.ts enforces this.
 */

export type DimensionId =
  | 'indexability'
  | 'ai_access'
  | 'performance'
  | 'structured_data'
  | 'content_quality'
  | 'semantics';

/** A published, citable standard. Every score must trace to one of these. */
export interface Benchmark {
  id: string;
  dimension: DimensionId;
  /** Human-readable threshold, e.g. "< 2.5s at p75" */
  threshold: string;
  /** Who published it — Google, W3C, schema.org, a peer-reviewed paper */
  authority: string;
  /** Link to the primary source */
  source: string;
}

/** Raw observation, gathered independently of the builder. */
export interface Evidence {
  url: string;
  finalUrl: string;
  status: number;
  headers: Record<string, string>;
  /** Exactly what came over the wire — what non-JS crawlers receive */
  rawHtml: string;
  /** Post-JavaScript, when a renderer is available */
  renderedHtml?: string;
  robotsTxt: string | null;
  /** Per-user-agent HTTP status, from real fetches */
  botAccess: Record<string, { status: number; wordCount: number }>;
  /** Real-user field data from the CrUX API. null when unavailable. */
  crux: CruxMetrics | null;
  fetchedAt: string;
}

export interface CruxMetrics {
  /** 75th percentile, milliseconds */
  lcpMs: number | null;
  inpMs: number | null;
  cls: number | null;
  source: 'crux-url' | 'crux-origin';
}

/** One check against one benchmark. */
export interface Check {
  benchmarkId: string;
  dimension: DimensionId;
  passed: boolean;
  /** What was actually observed */
  observed: string;
  /** What the benchmark requires */
  expected: string;
  /** Concrete remedy. Required — a failing check without a fix is useless. */
  fix?: string;
}

export interface DimensionScore {
  dimension: DimensionId;
  /** 0..1, or null when the dimension could not be verified */
  score: number | null;
  verified: boolean;
  reason?: string;
  checks: Check[];
}

export interface Gate {
  id: string;
  multiplier: number;
  triggered: boolean;
  message: string;
}

/** A prioritised, counterfactually-costed remedy. */
export interface Action {
  action: string;
  dimension: DimensionId;
  benchmarkId: string;
  /** Actual recomputed reward delta if this check were fixed. Not an estimate. */
  expectedRewardGain: number;
}

/** The machine-readable payload the builder MCP consumes. */
export interface CriticReport {
  url: string;
  gradedAt: string;
  /** 0..1 */
  reward: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  /** Drops as dimensions go unverified */
  confidence: number;
  dimensions: Record<DimensionId, DimensionScore>;
  gates: Gate[];
  actions: Action[];
  /** Present when comparing against a prior run */
  delta?: {
    previousReward: number;
    change: number;
    regressions: string[];
    improvements: string[];
  };
}
