export * from './types.js';
export {
  defineRule,
  registerRule,
  unregisterRule,
  getRules,
  getRule,
  runRules,
  defineConfig,
} from './engine.js';
export { extract, flattenJsonLd, schemaTypes } from './analyzers/extract.js';
export type { ExtractedPage } from './analyzers/extract.js';
export {
  fetchPage,
  fetchRobotsTxt,
  USER_AGENTS,
} from './crawler/fetch.js';
export { crawlSite } from './crawler/crawl.js';
export type { FetchOptions } from './crawler/fetch.js';
export {
  extractabilityScore,
  MIN_SCORABLE_WORDS,
  extractChunks,
  scoreChunk,
  calculateEntityDensity,
} from './rules/aeo.js';
export type { ExtractabilityResult, AeoChunk, ChunkScore } from './rules/aeo.js';
export {
  RETRIEVAL_BOTS,
  TRAINING_BOTS,
  parseRobots,
} from './rules/ai-access.js';

// Scaffolding & Memory Exports
export { detectFramework } from './scaffold/detector.js';
export type { FrameworkType } from './scaffold/detector.js';
export { initProject } from './scaffold/init.js';
export {
  getDb,
  closeDb,
  saveProject,
  loadProject,
  saveDecision,
  loadDecisions,
  saveFixOutcome,
  loadFixOutcomes,
  saveCrawl,
  loadCrawlHistory,
} from './memory/db.js';

// Importing the rule modules registers them. Order is irrelevant.
import './rules/html.js';
import './rules/ai-access.js';
import './rules/schema.js';
import './rules/aeo.js';
import './rules/site-intelligence.js';

// Platform Exports
export * from './platform/store.js';
export * from './platform/rules.js';
export * from './platform/verification.js';
export * from './platform/workflow.js';
export * from './platform/capabilities.js';
export * from './platform/frameworks.js';
export * from './platform/events.js';
export * from './platform/validators.js';
export * from './platform/reports.js';
export * from './platform/plugins.js';
export * from './platform/policy.js';
export * from './platform/certification.js';
export * from './platform/bootstrap.js';
export * from './platform/config.js';
export * from './platform/cache.js';
export * from './platform/ai.js';
export * from './platform/fixer.js';
export * from './events.js';
export * from './execution.js';
export * from './incremental.js';
export * from './sandbox.js';
export * from './scheduler.js';
export * from './config/provider.js';




