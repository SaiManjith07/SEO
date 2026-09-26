import { describe, it, expect } from 'vitest';
import * as registry from './index.js';
import { z } from 'zod';

describe('registry', () => {
  it('rejects agent without required fields', () => {
    expect(() => registry.agents.register({ 
      // missing id, canHandle, run
    } as any)).toThrow();
  });

  it('warns on duplicate id, overwrites', () => {
    const a = { id: 'x', version: '1', capabilities: [], 
      requires: {}, inputSchema: z.object({}), 
      outputSchema: z.object({}), canHandle: () => true, 
      run: async () => ({ findings: [], raw: {}, 
        dataSources: [], provenance: 'live' as const, 
        confidence: 'high' as const, errors: [] }) };
    registry.agents.register(a);
    expect(() => registry.agents.register(a)).not.toThrow();
    expect(registry.agents.get('x')).toBeDefined();
  });

  it('returns undefined for unknown id', () => {
    expect(registry.agents.get('does-not-exist')).toBeUndefined();
  });
});
