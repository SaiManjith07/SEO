import { describe, it, expect } from 'vitest';
import { provenanceLive } from './provenance.js';

describe('provenance.live', () => {
  it('passes when provenance is live', () => {
    const res = provenanceLive.run({ provenance: 'live' }, {});
    expect(res.ok).toBe(true);
  });

  it('fails when provenance is mock', () => {
    const res = provenanceLive.run({ provenance: 'mock' }, {});
    expect(res.ok).toBe(false);
    expect((res as any).message).toMatch(/mocked data/);
  });
});
