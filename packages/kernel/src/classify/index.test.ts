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
    expect(res.params.url).toBeUndefined();
  });

  it('returns unknown for empty input', () => {
    const res = classify('');
    expect(res.goal).toBe('unknown');
  });

  it('audit mysite.com -> url = mysite.com, confidence = inferred', () => {
    const res = classify('audit mysite.com');
    expect(res.params.url).toBe('mysite.com');
    expect(res.params.urlConfidence).toBe('inferred');
  });

  it('audit https://mysite.com/path?q=1 -> url = https://mysite.com/path?q=1, confidence = explicit', () => {
    const res = classify('audit https://mysite.com/path?q=1');
    expect(res.params.url).toBe('https://mysite.com/path?q=1');
    expect(res.params.urlConfidence).toBe('explicit');
  });

  it('audit www.mysite.co.uk -> url contains www.mysite.co.uk, confidence = explicit', () => {
    const res = classify('audit www.mysite.co.uk');
    expect(res.params.url).toBe('www.mysite.co.uk');
    expect(res.params.urlConfidence).toBe('explicit');
  });

  it('audit example.e -> NO url param (TLD is 1 letter)', () => {
    const res = classify('audit example.e');
    expect(res.params.url).toBeUndefined();
  });

  it('audit e.g. something -> NO url param', () => {
    const res = classify('audit e.g. something');
    expect(res.params.url).toBeUndefined();
  });

  it('check core web vitals on staging.example.com -> url = staging.example.com', () => {
    const res = classify('check core web vitals on staging.example.com');
    expect(res.params.url).toBe('staging.example.com');
  });
});
