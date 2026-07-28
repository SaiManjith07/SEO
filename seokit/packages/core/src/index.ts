export * from './types.js';
export {
  defineRule,
  registerRule,
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
export type { FetchOptions } from './crawler/fetch.js';
export { extractabilityScore, MIN_SCORABLE_WORDS } from './rules/aeo.js';
export type { ExtractabilityResult } from './rules/aeo.js';
export {
  RETRIEVAL_BOTS,
  TRAINING_BOTS,
  parseRobots,
} from './rules/ai-access.js';

// Importing the rule modules registers them. Order is irrelevant.
import './rules/html.js';
import './rules/ai-access.js';
import './rules/schema.js';
import './rules/aeo.js';
