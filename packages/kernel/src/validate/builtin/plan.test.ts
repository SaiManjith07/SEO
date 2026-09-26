import { describe, it, expect, beforeEach } from 'vitest';
import { planNoCycles, planDepsAvailable } from './plan.js';
import { agents } from '../../registry/index.js';

describe('plan.noCycles', () => {
  it('passes on acyclic graph', () => {
    const res = planNoCycles.run({ graph: { A: ['B'], B: [] } }, {});
    expect(res.ok).toBe(true);
  });

  it('fails on cyclic graph', () => {
    const res = planNoCycles.run({ graph: { A: ['B'], B: ['A'] } }, {});
    expect(res.ok).toBe(false);
    expect((res as any).message).toMatch(/Cycle detected/);
  });
});

describe('plan.depsAvailable', () => {
  beforeEach(() => {
    agents.clear();
  });

  it('passes when agent exists and creds met', () => {
    process.env.TEST_KEY = 'val';
    agents.register({
      id: 'test-agent',
      version: '1',
      capabilities: [],
      inputSchema: {} as any,
      outputSchema: {} as any,
      canHandle: () => true,
      requires: { credentials: ['TEST_KEY'] },
      run: async () => ({} as any)
    });

    const plan = { 
      steps: [{ id: 'step1', agentId: 'test-agent', dependsOn: [], params: {} }],
      batches: [['step1']], 
      totalSteps: 1 
    };
    const res = planDepsAvailable.run(plan, {});
    expect(res.ok).toBe(true);
  });

  it('fails when agent is missing', () => {
    const plan = { 
      steps: [{ id: 'step1', agentId: 'missing-agent', dependsOn: [], params: {} }],
      batches: [['step1']], 
      totalSteps: 1 
    };
    const res = planDepsAvailable.run(plan, {});
    expect(res.ok).toBe(false);
    expect((res as any).message).toMatch(/not in the registry/);
  });
});
