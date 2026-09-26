import { describe, it, expect } from 'vitest';
import { mergeNoConflict, mergeCoverage } from './merge.js';

describe('merge.noConflict', () => {
  it('passes when fixes agree', () => {
    const res = mergeNoConflict.run([
      { findings: [{ id: 'x', fix: 'a' }] },
      { findings: [{ id: 'y', fix: 'b' }, { id: 'x', fix: 'a' }] }
    ], {});
    expect(res.ok).toBe(true);
  });

  it('fails when fixes conflict', () => {
    const res = mergeNoConflict.run([
      { findings: [{ id: 'x', fix: 'a' }] },
      { findings: [{ id: 'x', fix: 'b' }] }
    ], {});
    expect(res.ok).toBe(false);
    expect((res as any).message).toMatch(/Conflict on finding x/);
  });
});

describe('merge.coverage', () => {
  it('passes when coverage is high', () => {
    const res = mergeCoverage.run({ metrics: { coverage: 0.8 } }, {});
    expect(res.ok).toBe(true);
  });

  it('fails (warns) when coverage is low', () => {
    const res = mergeCoverage.run({ metrics: { coverage: 0.2 } }, {});
    expect(res.ok).toBe(false);
    expect((res as any).message).toMatch(/below 50%/);
  });
});
