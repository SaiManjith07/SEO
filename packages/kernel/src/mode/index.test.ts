import { describe, it, expect } from 'vitest';
import { resolveMode } from './index.js';

describe('Mode Resolution', () => {
  it('1. If explicit, use it', () => {
    expect(resolveMode({ explicit: 'prod', targetIsLocal: true })).toBe('prod');
    expect(resolveMode({ explicit: 'dev', env: 'production' })).toBe('dev');
  });

  it('2. If targetIsLocal, dev', () => {
    expect(resolveMode({ targetIsLocal: true, env: 'production', targetIsLiveUrl: true })).toBe('dev');
  });

  it('3. If env === production and targetIsLiveUrl, prod', () => {
    expect(resolveMode({ env: 'production', targetIsLiveUrl: true })).toBe('prod');
  });

  it('4. If env === production, prod', () => {
    expect(resolveMode({ env: 'production' })).toBe('prod');
  });

  it('5. Default: dev', () => {
    expect(resolveMode({})).toBe('dev');
    expect(resolveMode({ env: 'development', targetIsLiveUrl: true })).toBe('dev');
  });
});
