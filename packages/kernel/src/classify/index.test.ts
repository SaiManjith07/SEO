import { describe, it, expect, beforeEach } from 'vitest';
import { classify } from './index.js';
import { registry } from '../index.js';

describe('classify', () => {
  beforeEach(() => {
    registry.agents.clear();
    const dummyAgent = (id: string, cap: string[]) => {
      registry.agents.register({
        id,
        version: '1',
        capabilities: cap,
        inputSchema: {} as any,
        outputSchema: {} as any,
        canHandle: () => true,
        run: async () => ({} as any)
      });
    };
    dummyAgent('a1', ['audit']);
    dummyAgent('a2', ['aeo']);
    dummyAgent('a3', ['rank']);
    dummyAgent('a4', ['performance']);
  });

  it('matches audit and extracts url', () => {
    const res = classify('audit mysite.com');
    expect(res.capabilities).toContain('audit');
    expect(res.params.url).toBe('mysite.com');
  });

  it('matches aeo for chatgpt', () => {
    const res = classify('why are we losing chatgpt citations');
    expect(res.capabilities).toContain('aeo');
  });

  it('matches rank for top queries', () => {
    const res = classify('show my top queries this week');
    expect(res.capabilities).toContain('rank');
  });

  it('returns unknown for gibberish', () => {
    const res = classify('purple monkey dishwasher');
    expect(res.goal).toBe('unknown');
    expect(res.confidence).toBe('low');
    expect(res.capabilities.length).toBe(0);
  });

  it('returns unknown for empty input', () => {
    const res = classify('');
    expect(res.goal).toBe('unknown');
  });
});
