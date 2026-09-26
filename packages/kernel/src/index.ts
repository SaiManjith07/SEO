import { ClassifiedTask, OrchestrateOptions, OrchestrationReport, OrchestrationError } from './types.js';
import * as registry from './registry/index.js';
import { validate } from './validate/engine.js';
import { builtinValidators } from './validate/builtin/index.js';
import { classify, ClassifiedTask } from './classify/index.js';
import { plan, ExecutionPlan } from './plan/index.js';

// Register built-in validators
for (const v of builtinValidators) {
  registry.validators.register(v);
}

export function registerPlugin(plugin: { register: (reg: typeof registry) => void }) {
  plugin.register(registry);
}

/**
 * Main entry point for SEOKit kernel.
 * 
 * @param taskStr The natural language task string.
 * @param options Orchestration options.
 * @returns The orchestration report.
 * 
 * Note: Credential resolution is currently stubbed to require CRUX_API_KEY.
 * This will be dynamically resolved from task capabilities in Step 3.
 */
export async function orchestrate(taskStr: string, options?: OrchestrateOptions): Promise<any> {
  const task = classify(taskStr);
  
  const intakeCtx = buildIntakeContext(task);
  const intakeResult = await validate('task.intake', task, intakeCtx);
  if (!intakeResult.passed) {
    const f = intakeResult.failures[0];
    throw new OrchestrationError(intakeResult.gate, f.validatorId, f.agentId, f.raw, f.message);
  }
  
  const p = plan(task);
  
  const planResult = await validate('plan.build', p, { task, registry });
  if (!planResult.passed) {
    const f = planResult.failures[0];
    throw new OrchestrationError(planResult.gate, f.validatorId, f.agentId, f.raw, f.message);
  }
  
  // Step 4 will implement execute(); return plan-only for now
  return {
    id: `run-${Date.now()}`,
    timestamp: new Date().toISOString(),
    task,
    plan: p,
    metrics: { totalSteps: p.totalSteps, successfulSteps: 0, coverage: 0 },
    findings: [],
    validation: { intake: intakeResult, plan: planResult }
  };
}

function buildIntakeContext(task: ClassifiedTask) {
  const requiredCredentials = new Set<string>();
  const agents = registry.agents.list();

  for (const cap of task.capabilities) {
    for (const a of agents) {
      if (a.capabilities?.includes(cap) && a.canHandle(task)) {
        if (a.requires?.credentials) {
          a.requires.credentials.forEach(c => requiredCredentials.add(c));
        }
      }
    }
  }

  return { requiredCredentials: Array.from(requiredCredentials) };
}

export { registry };
export * from './types.js';
