import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { plan } from './index.js';
import { registry } from '../index.js';
import { ClassifiedTask } from '../types.js';
import { SeoKitConfig } from '../config/index.js';

describe('plan with modes and sources', () => {
  beforeEach(() => {
    registry.agents.clear();
    const dummyAgent = (id: string, cap: string[], modes?: ('dev'|'prod')[], sources?: string[], creds?: string[]) => {
      registry.agents.register({
        id,
        version: '1',
        modes,
        capabilities: cap,
        inputSchema: {} as any,
        outputSchema: {} as any,
        canHandle: () => true,
        requires: { dataSources: sources, credentials: creds },
        run: async () => ({} as any)
      });
    };
    dummyAgent('A', ['capA'], ['dev']);
    dummyAgent('B', ['capB'], ['prod'], ['crux']);
    dummyAgent('C', ['capC'], ['prod'], ['crux'], ['CRUX_API_KEY']);
  });

  afterEach(() => {
    delete process.env.CRUX_API_KEY;
  });

  const makeTask = (caps: string[]): ClassifiedTask => ({
    goal: 'test',
    capabilities: caps,
    params: {},
    rawInput: 'test',
    confidence: 'high'
  });

  const baseConfig: SeoKitConfig = {
    version: 1,
    goals: [],
    sources: {},
    modes: { dev: { blockOnFail: false }, prod: { schedule: '', alertWebhook: null } }
  };

  it('Dev mode excludes a prod-only agent', () => {
    const p = plan(makeTask(['capB']), {
      mode: 'dev',
      config: baseConfig,
      registry
    });
    expect(p.skipped.length).toBe(1);
    expect(p.skipped[0].reason).toBe('mode-mismatch');
  });

  it('Prod mode with crux disabled produces a skipped entry with reason source-disabled', () => {
    const p = plan(makeTask(['capB']), {
      mode: 'prod',
      config: baseConfig,
      registry
    });
    expect(p.skipped.length).toBe(1);
    expect(p.skipped[0].reason).toBe('source-disabled');
    expect(p.skipped[0].hint).toContain('seokit sources enable crux');
  });

  it('Prod mode with crux enabled but CRUX_API_KEY unset produces reason credentials-missing', () => {
    const config = { ...baseConfig, sources: { crux: { enabled: true } } };
    const p = plan(makeTask(['capC']), {
      mode: 'prod',
      config,
      registry
    });
    expect(p.skipped.length).toBe(1);
    expect(p.skipped[0].reason).toBe('credentials-missing');
  });

  it('The hint string is populated and mentions the source id', () => {
    const p = plan(makeTask(['capB']), {
      mode: 'prod',
      config: baseConfig,
      registry
    });
    expect(p.skipped[0].hint).toBe('seokit sources enable crux');
    expect(p.skipped[0].sourceIds).toContain('crux');
  });

  it('Agent runs successfully if mode and source match', () => {
    const config = { ...baseConfig, sources: { crux: { enabled: true } } };
    const p = plan(makeTask(['capB']), {
      mode: 'prod',
      config,
      registry
    });
    expect(p.steps.length).toBe(1);
    expect(p.skipped.length).toBe(0);
  });

  it('Agent runs successfully if mode and credentials match', () => {
    process.env.CRUX_API_KEY = 'test';
    const config = { ...baseConfig, sources: { crux: { enabled: true } } };
    const p = plan(makeTask(['capC']), {
      mode: 'prod',
      config,
      registry
    });
    expect(p.steps.length).toBe(1);
    expect(p.skipped.length).toBe(0);
  });
});
