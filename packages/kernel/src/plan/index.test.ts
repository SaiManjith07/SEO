import { describe, it, expect, beforeEach } from 'vitest';
import { plan } from './index.js';
import { registry } from '../index.js';
import { ClassifiedTask } from '../classify/index.js';

describe('plan', () => {
  beforeEach(() => {
    registry.agents.clear();
    const dummyAgent = (id: string, cap: string[], deps: string[] = []) => {
      registry.agents.register({
        id,
        version: '1',
        capabilities: cap,
        inputSchema: {} as any,
        outputSchema: {} as any,
        canHandle: () => true,
        requires: { peers: deps },
        run: async () => ({} as any)
      });
    };
    dummyAgent('A', ['capA']);
    dummyAgent('B', ['capB'], ['A']);
    dummyAgent('C', ['capC']);
    dummyAgent('D', ['capD'], ['E']);
    dummyAgent('E', ['capE'], ['D']);
  });

  const makeTask = (caps: string[]): ClassifiedTask => ({
    goal: 'test',
    capabilities: caps,
    params: {},
    rawInput: 'test',
    confidence: 'high'
  });

  it('Single capability, single agent -> 1 step, 1 batch', () => {
    const p = plan(makeTask(['capA']));
    expect(p.totalSteps).toBe(1);
    expect(p.batches.length).toBe(1);
    expect(p.batches[0]).toContain('A');
  });

  it('Two independent capabilities -> 2 steps, 1 batch', () => {
    const p = plan(makeTask(['capA', 'capC']));
    expect(p.totalSteps).toBe(2);
    expect(p.batches.length).toBe(1);
    expect(p.batches[0]).toContain('A');
    expect(p.batches[0]).toContain('C');
  });

  it('Agent B depends on Agent A -> 2 steps, 2 batches, B in second', () => {
    const p = plan(makeTask(['capA', 'capB']));
    expect(p.totalSteps).toBe(2);
    expect(p.batches.length).toBe(2);
    expect(p.batches[0]).toContain('A');
    expect(p.batches[1]).toContain('B');
  });

  it('Cycle D->E->D -> throws with cycle path in message', () => {
    expect(() => plan(makeTask(['capD', 'capE']))).toThrow(/Cycle detected/);
  });

  it('Capability with no matching agent -> throws', () => {
    expect(() => plan(makeTask(['capX']))).toThrow(/no agent for capability capX/);
  });

  it('Agent requires a credential that is missing -> does not throw', () => {
    registry.agents.register({
      id: 'F',
      version: '1',
      capabilities: ['capF'],
      inputSchema: {} as any,
      outputSchema: {} as any,
      canHandle: () => true,
      requires: { credentials: ['MISSING_KEY'] },
      run: async () => ({} as any)
    });
    const p = plan(makeTask(['capF']));
    expect(p.totalSteps).toBe(1);
  });

  it('Arbitrates between multiple agents by highest priority', () => {
    registry.agents.register({
      id: 'agent1',
      version: '1',
      capabilities: ['capAudit'],
      priority: 1,
      inputSchema: {} as any,
      outputSchema: {} as any,
      canHandle: () => true,
      run: async () => ({} as any)
    });
    registry.agents.register({
      id: 'agent5',
      version: '1',
      capabilities: ['capAudit'],
      priority: 5,
      inputSchema: {} as any,
      outputSchema: {} as any,
      canHandle: () => true,
      run: async () => ({} as any)
    });
    const p = plan(makeTask(['capAudit']));
    expect(p.totalSteps).toBe(1);
    expect(p.steps[0].agentId).toBe('agent5');
  });
});
