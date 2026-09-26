import { describe, it, expect } from 'vitest';
import { registerPlugin, registry } from './index.js';
import { z } from 'zod';

describe('kernel/index', () => {
  it('registerPlugin calls plugin.register with registry', () => {
    let called = false;
    const dummyPlugin = {
      register: (reg: typeof registry) => {
        called = true;
        expect(reg).toBe(registry);
        
        // Test registering an agent
        reg.agents.register({
          id: 'test-agent',
          version: '1.0',
          capabilities: [],
          inputSchema: z.object({}),
          outputSchema: z.object({}),
          canHandle: () => true,
          run: async () => ({ findings: [], raw: {}, dataSources: [], provenance: 'mock', confidence: 'high', errors: [] })
        });
      }
    };
    
    registerPlugin(dummyPlugin);
    expect(called).toBe(true);
  });
  it('resolves required credentials from task capabilities, not hardcoded list', async () => {
    // Register agents for testing
    registry.agents.register({
      id: 'perf-agent',
      version: '1',
      capabilities: ['performance'],
      inputSchema: {} as any,
      outputSchema: {} as any,
      canHandle: () => true,
      requires: { credentials: ['CRUX_API_KEY'] },
      run: async () => ({} as any)
    });

    registry.agents.register({
      id: 'rank-agent',
      version: '1',
      capabilities: ['rank'],
      inputSchema: {} as any,
      outputSchema: {} as any,
      canHandle: () => true,
      requires: { credentials: ['GSC_SERVICE_ACCOUNT_PATH'] },
      run: async () => ({} as any)
    });

    const originalEnv = { ...process.env };
    
    // Test 1: performance task with CRUX_API_KEY unset
    delete process.env.CRUX_API_KEY;
    await expect(import('./index.js').then(m => m.orchestrate('check core web vitals for https://example.com')))
      .rejects.toThrow(/CRUX_API_KEY/);

    // Test 2: rank task with GSC_SERVICE_ACCOUNT_PATH unset and CRUX_API_KEY set
    process.env.CRUX_API_KEY = 'test_key';
    delete process.env.GSC_SERVICE_ACCOUNT_PATH;
    await expect(import('./index.js').then(m => m.orchestrate('show my top queries')))
      .rejects.toThrow(/GSC_SERVICE_ACCOUNT_PATH/);

    // Test 3: performance task with CRUX_API_KEY set
    process.env.CRUX_API_KEY = 'test_key';
    const m = await import('./index.js');
    const res = await m.orchestrate('check core web vitals');
    expect(res.plan.steps.some((s: any) => s.agentId === 'perf-agent')).toBe(true);

    process.env = originalEnv;
  });
});
