import { credentialsPresent, credentialsValid } from './credentials.js';
import { agentInputSchema, agentOutputSchema, toolInputSchema, toolOutputSchema } from './schema.js';
import { findingHasFix, findingHasEvidence, findingNoFabrication } from './finding.js';
import { provenanceLive } from './provenance.js';
import { exitCodeSafe } from './exit-code.js';
import { planNoCycles, planDepsAvailable } from './plan.js';
import { mergeNoConflict, mergeCoverage } from './merge.js';
import { reportNoSecrets } from './secrets.js';

import { provenanceModeCompatible } from './provenance-mode.js';

export const builtinValidators = [
  credentialsPresent,
  credentialsValid,
  agentInputSchema,
  agentOutputSchema,
  toolInputSchema,
  toolOutputSchema,
  findingHasFix,
  findingHasEvidence,
  findingNoFabrication,
  provenanceLive,
  provenanceModeCompatible,
  exitCodeSafe,
  planNoCycles,
  planDepsAvailable,
  mergeNoConflict,
  mergeCoverage,
  reportNoSecrets
];
