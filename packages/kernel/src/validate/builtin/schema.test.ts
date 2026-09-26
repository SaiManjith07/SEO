import { describe, it, expect } from 'vitest';
import { agentInputSchema } from './schema.js';
import { z } from 'zod';

describe('schema validators', () => {
  const ctx = {
    agent: {
      id: 'test-agent',
      inputSchema: z.object({ url: z.string().url() })
    }
  };

  it('passes on valid input', () => {
    const res = agentInputSchema.run({ url: 'https://example.com' }, ctx);
    expect(res.ok).toBe(true);
  });

  it('fails on invalid input', () => {
    const res = agentInputSchema.run({ url: 'not-a-url' }, ctx);
    expect(res.ok).toBe(false);
    expect((res as any).message).toMatch(/inputSchema validation failed/);
  });
});
