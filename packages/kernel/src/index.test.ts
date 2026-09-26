import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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
  describe('credential resolution', () => {
    beforeEach(() => {
      registry.agents.clear();
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
    });

    afterEach(() => {
      delete process.env.CRUX_API_KEY;
      delete process.env.GSC_SERVICE_ACCOUNT_PATH;
    });

    it('performance task without CRUX_API_KEY rejects with /CRUX_API_KEY/', async () => {
      delete process.env.CRUX_API_KEY;
      const m = await import('./index.js');
      await expect(m.orchestrate('check core web vitals for https://example.com'))
        .rejects.toThrow(/CRUX_API_KEY/);
    });

    it('rank task without GSC creds rejects with /GSC_SERVICE_ACCOUNT_PATH/ and NOT /CRUX_API_KEY/', async () => {
      process.env.CRUX_API_KEY = 'test_key';
      delete process.env.GSC_SERVICE_ACCOUNT_PATH;
      const m = await import('./index.js');
      const promise = m.orchestrate('show my top queries');
      await expect(promise).rejects.toThrow(/GSC_SERVICE_ACCOUNT_PATH/);
      await expect(promise).rejects.not.toThrow(/CRUX_API_KEY/);
    });

    it('performance task with CRUX_API_KEY builds a plan with perf-agent', async () => {
      process.env.CRUX_API_KEY = 'test_key';
      const m = await import('./index.js');
      const res = await m.orchestrate('check core web vitals');
      expect(res.plan.steps.some((s: any) => s.agentId === 'perf-agent')).toBe(true);
    });
  });
});
