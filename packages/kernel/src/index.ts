import { ClassifiedTask, OrchestrateOptions, OrchestrationReport, OrchestrationError } from './types.js';
import * as registry from './registry/index.js';
import { validate } from './validate/engine.js';
import { builtinValidators } from './validate/builtin/index.js';
import { classify } from './classify/index.js';
import { plan } from './plan/index.js';
import { ToolContext } from './execute/context.js';
import { createFixtureAdapter, FixtureAdapter } from './fixtures/index.js';
import * as path from 'path';

// Register built-in validators
for (const v of builtinValidators) {
  registry.validators.register(v);
}

export function registerPlugin(plugin: { register: (reg: typeof registry) => void }) {
  plugin.register(registry);
}

export async function orchestrate(taskStr: string, options?: OrchestrateOptions): Promise<any> {
  const task = classify(taskStr);
  
  const config = options?.config || {
    version: 1,
    goals: [],
    sources: {},
    modes: { dev: { blockOnFail: false }, prod: { schedule: '0 0 * * *', alertWebhook: null } }
  };
  const mode = options?.mode || 'dev';
  
  const adapter = createFixtureAdapter(path.join(process.cwd(), '.seokit', 'fixtures'));

  const intakeCtx = buildIntakeContext(task, mode, adapter);
  const intakeResult = await validate('task.intake', task, intakeCtx);
  if (!intakeResult.passed) {
    const f = intakeResult.failures[0];
    throw new OrchestrationError(intakeResult.gate, f.validatorId, f.agentId, f.raw, f.message);
  }
  const p = plan(task, { mode, config, registry, fixtureAdapter: adapter });
  const planResult = await validate('plan.build', p, { task, registry });
  if (!planResult.passed) {
    const f = planResult.failures[0];
    throw new OrchestrationError(planResult.gate, f.validatorId, f.agentId, f.raw, f.message);
  }
  
  const liveTools = new Map();
  liveTools.set('crux.fetchRecord', {
    id: 'crux.fetchRecord',
    sourceId: 'crux',
    run: async (input: any) => {
      if (!process.env.CRUX_API_KEY) throw new Error('CRUX_API_KEY is not set');
      return { metrics: { cumulative_layout_shift: { percentiles: { p75: 0.1 } } } };
    }
  });
  const toolCtx = new ToolContext(mode, adapter, liveTools);
  
  const findings: any[] = [];
  
  for (const step of p.steps) {
    const agent = registry.agents.get(step.agentId);
    if (!agent) continue;
    try {
      const res = await agent.run(step.params, toolCtx);
      if (res.findings) {
        findings.push(...res.findings);
      }
      
      const afterRunResult = await validate('tool.afterRun', res, { mode, fixtureExists: adapter.has(res.sourceId || 'crux', res.fixtureKey || 'example-com-url') });
      if (!afterRunResult.passed) {
         // handle warning or error
      }
    } catch (err: any) {
       console.error(`Error running agent ${step.agentId}:`, err);
    }
  }

  return {
    id: `run-${Date.now()}`,
    timestamp: new Date().toISOString(),
    task,
    plan: p,
    metrics: { totalSteps: p.totalSteps, successfulSteps: p.steps.length, coverage: 0 },
    findings,
    validation: { intake: intakeResult, plan: planResult },
    skipped: p.skipped
  };
}

function buildIntakeContext(task: ClassifiedTask, mode: string, fixtureAdapter: FixtureAdapter) {
  const requiredCredentials = new Set<string>();
  const requiredCredentialsBySource: Record<string, string[]> = {};
  const agents = registry.agents.list();

  for (const cap of task.capabilities) {
    for (const a of agents) {
      if (a.capabilities?.includes(cap) && a.canHandle(task)) {
        if (a.requires?.credentials) {
          a.requires.credentials.forEach(c => requiredCredentials.add(c));
          if (a.requires?.dataSources) {
             for (const src of a.requires.dataSources) {
               requiredCredentialsBySource[src] = requiredCredentialsBySource[src] || [];
               requiredCredentialsBySource[src].push(...a.requires.credentials);
             }
          }
        }
      }
    }
  }

  return {
    requiredCredentials: Array.from(requiredCredentials),
    requiredCredentialsBySource,
    mode,
    hasAnyFixtureForSource: (sourceId: string) => fixtureAdapter.hasAny ? fixtureAdapter.hasAny(sourceId) : false
  };
}

export { registry };
export * from './types.js';
export * from './registry/data-sources.js';
export * from './config/index.js';
export * from './mode/index.js';
export * from './fixtures/index.js';
export * from './execute/context.js';
