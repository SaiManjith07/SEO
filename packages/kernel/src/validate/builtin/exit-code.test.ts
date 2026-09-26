import { describe, it, expect } from 'vitest';
import { exitCodeSafe } from './exit-code.js';

describe('exitCode.safe', () => {
  it('passes on normal exit code', () => {
    const res = exitCodeSafe.run({ exitCode: 0 }, {});
    expect(res.ok).toBe(true);
  });

  it('fails on crash exit code', () => {
    const res = exitCodeSafe.run({ exitCode: -1073740791 }, {});
    expect(res.ok).toBe(false);
    expect((res as any).message).toMatch(/unsafe exit code/);
  });

  it('fails on null exit code without error', () => {
    const res = exitCodeSafe.run({ exitCode: null }, {});
    expect(res.ok).toBe(false);
    expect((res as any).message).toMatch(/code null/);
  });
});
