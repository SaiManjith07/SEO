/**
 * SEOKit core types.
 *
 * The whole architecture is here: a Rule is a pure function from a Context
 * to Findings. Everything else in this package is either a Context producer
 * or a Finding consumer.
 */

export type Severity = 'error' | 'warning' | 'info' | 'off';

export type RuleCategory =
  | 'technical'
  | 'content'
  | 'schema'
  | 'performance'
  | 'ai-access'
  | 'aeo';

/** Which kind of context a rule consumes. Determines when it can run. */
export type ContextKind = 'source' | 'page' | 'site';

export interface Location {
  file?: string;
  url?: string;
  line?: number;
  selector?: string;
}

/**
 * A single problem found. `fix` is the field that makes this useful to an
 * IDE agent — a finding without a fix is a complaint; a finding with one
 * is an instruction.
 */
export interface Finding {
  ruleId: string;
  severity: Exclude<Severity, 'off'>;
  message: string;
  fix: string;
  location?: Location;
  evidence?: unknown;
}

// ---------------------------------------------------------------------------
// Contexts
// ---------------------------------------------------------------------------

export type Framework =
  | 'next'
  | 'nuxt'
  | 'astro'
  | 'sveltekit'
  | 'remix'
  | 'static'
  | 'unknown';

export interface RouteInfo {
  /** Route pattern, e.g. /blog/[slug] */
  pattern: string;
  /** Absolute path to the file that defines it */
  file: string;
  /** True if the framework will render this on the server */
  serverRendered: boolean;
}

/** Build-time context. No network, no browser. Milliseconds to produce. */
export interface SourceContext {
  kind: 'source';
  root: string;
  framework: Framework;
  routes: RouteInfo[];
  /** Present when checking one specific file */
  file?: {
    path: string;
    content: string;
  };
  config?: SeoKitConfig;
}

/** Runtime context for a single live page. */
export interface PageContext {
  kind: 'page';
  url: string;
  status: number;
  headers: Record<string, string>;
  /** HTML exactly as served. This is what GPTBot / ClaudeBot / PerplexityBot see. */
  rawHtml: string;
  /** HTML after JavaScript execution. What Googlebot eventually sees. */
  renderedHtml?: string;
  timings?: {
    ttfbMs?: number;
    lcpMs?: number;
    cls?: number;
    inpMs?: number;
  };
  config?: SeoKitConfig;
}

export interface SiteContext {
  kind: 'site';
  origin: string;
  pages: PageContext[];
  robotsTxt: string | null;
  llmsTxt: string | null;
  sitemapUrls: string[];
  /** url -> outbound internal links */
  linkGraph: Map<string, string[]>;
  /** Computed internal PageRank scores */
  pageRanks?: Map<string, number>;
  config?: SeoKitConfig;
}

export type Context = SourceContext | PageContext | SiteContext;

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

export interface Rule<C extends Context = Context> {
  /** Namespaced, stable: 'html/missing-h1' */
  id: string;
  category: RuleCategory;
  /** Default severity; overridable via config */
  severity: Exclude<Severity, 'off'>;
  /** Which context this rule needs */
  needs: ContextKind;
  /** One-line description shown in tool output */
  description: string;
  /** Link into the research pack or external docs */
  docs?: string;
  check(ctx: C): Finding[];
  /** Rules that must pass (no errors or warnings) before this rule runs */
  dependencies?: string[];
  
  // v4 Metadata expansion
  name?: string;
  tags?: string[];
  estimatedCost?: 'low' | 'high';
  timeout?: number;
  cacheable?: boolean;
  fixable?: boolean;
  guidelineVersion?: string;
  experimental?: boolean;
  deprecated?: boolean;
  condition?: (ctx: C) => boolean;
}

export interface RuleOverride {
  severity?: Severity;
  options?: Record<string, unknown>;
}

export interface SeoKitConfig {
  site?: { url?: string; name?: string };
  framework?: Framework | 'auto';
  rules?: Record<string, Severity | [Severity, Record<string, unknown>]>;
  ignore?: string[];
  aiCrawlers?: string[];
  extends?: string[];
  intelligence?: {
    thinContentThreshold?: number;
    duplicateSimilarity?: number;
    cannibalizationSimilarity?: number;
    orphanExclusions?: string[];
    requiredEeatPages?: string[];
  };
  aeo?: {
    questionHeadingsRatio?: number;
    statisticsDensityMinWordCount?: number;
    statisticsDensityRatio?: number;
    outboundCitationsMinWordCount?: number;
    outboundCitationsMinCount?: number;
    pronounDensityMinWordCount?: number;
    pronounDensityMaxRatio?: number;
    longParagraphsMaxParagraphCount?: number;
    longParagraphsMaxWordCount?: number;
    longParagraphsRatio?: number;
    answerFirstOpeningMinWordCount?: number;
    answerFirstOpeningWordsRange?: number;
    minScorableWords?: number;
    chunkSuitabilityMinWords?: number;
    chunkSuitabilityMaxWords?: number;
    chunkSuitabilityPronounDensity?: number;
    entityDensityHighRatio?: number;
    entityDensityMedRatio?: number;
  };
  schema?: {
    minSameAsCount?: number;
    parityProbeSliceLength?: number;
    parityMinProbeLength?: number;
  };
  aiAccess?: {
    minServerTextRatio?: number;
    minServerWordCount?: number;
  };
  sandbox?: {
    cpuTimeoutMs?: number;
  };
  tracking?: {
    retentionDays?: number;
    comparisonWindowDays?: number;
    alertPositionDropThreshold?: number;
    alertPositionImproveThreshold?: number;
    alertCtrDropThreshold?: number;
  };
}

export interface RunResult {
  findings: Finding[];
  /** Rules that were skipped because the context kind did not match */
  skipped: string[];
  stats: {
    errors: number;
    warnings: number;
    infos: number;
    rulesRun: number;
    durationMs: number;
  };
}
