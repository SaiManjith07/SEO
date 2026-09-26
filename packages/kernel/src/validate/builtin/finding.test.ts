import { describe, it, expect } from 'vitest';
import { findingHasFix, findingHasEvidence, findingNoFabrication } from './finding.js';

describe('finding.hasFix', () => {
  it('A finding with fix: \'review the page\' -> FAILS', () => {
    const res = findingHasFix.run({ findings: [{ id: 'x', fix: 'review the page' }] }, {});
    expect(res.ok).toBe(false);
  });

  it('A finding with fix: \'TBD\' -> FAILS', () => {
    const res = findingHasFix.run({ findings: [{ id: 'x', fix: 'TBD' }] }, {});
    expect(res.ok).toBe(false);
  });

  it('A finding with fix: \'\' -> FAILS', () => {
    const res = findingHasFix.run({ findings: [{ id: 'x', fix: '' }] }, {});
    expect(res.ok).toBe(false);
  });

  it('A finding with fix: \'Add a canonical link tag to the <head>\' -> PASSES', () => {
    const res = findingHasFix.run({ findings: [{ id: 'x', fix: 'Add a canonical link tag to the <head>' }] }, {});
    expect(res.ok).toBe(true);
  });
});

describe('finding.hasEvidence', () => {
  it('finding with f.raw -> pass', () => {
    const res = findingHasEvidence.run({ findings: [{ id: 'x', raw: { data: 1 } }] }, {});
    expect(res.ok).toBe(true);
  });

  it('finding with f.source -> pass', () => {
    const res = findingHasEvidence.run({ findings: [{ id: 'x', source: 'test' }] }, {});
    expect(res.ok).toBe(true);
  });

  it('no f.raw, no f.source, root raw = {} -> fail', () => {
    const res = findingHasEvidence.run({ raw: {}, findings: [{ id: 'x' }] }, {});
    expect(res.ok).toBe(false);
  });

  it('no f.raw, no f.source, root raw = { data: 1 } -> pass (with warning logged in engine)', () => {
    const res = findingHasEvidence.run({ raw: { data: 1 }, findings: [{ id: 'x' }] }, {});
    expect(res.ok).toBe(true);
  });

  it('no f.raw, no f.source, root raw = undefined -> fail', () => {
    const res = findingHasEvidence.run({ findings: [{ id: 'x' }] }, {});
    expect(res.ok).toBe(false);
  });
});

describe('finding.noFabrication', () => {
  it('finding provenance=\'live\', raw={} -> fail', () => {
    const res = findingNoFabrication.run({ provenance: 'live', raw: {}, findings: [{ id: 'x' }] }, {});
    expect(res.ok).toBe(false);
  });

  it('finding provenance=\'live\', raw={data:1} -> pass', () => {
    const res = findingNoFabrication.run({ provenance: 'live', raw: { data: 'test' }, findings: [{ id: 'x' }] }, {});
    expect(res.ok).toBe(true);
  });

  it('finding provenance=\'mock\' -> pass', () => {
    const res = findingNoFabrication.run({ provenance: 'mock', raw: {}, findings: [{ id: 'x' }] }, {});
    expect(res.ok).toBe(true);
  });

  it('finding has NO provenance and input has NO provenance -> FAIL', () => {
    const res = findingNoFabrication.run({ raw: { data: 1 }, findings: [{ id: 'x' }] }, {});
    expect(res.ok).toBe(false);
    expect((res as any).message).toMatch(/finding x has no provenance declared/);
  });

  it('Empty findings[] with all creds present -> fail', () => {
    const originalEnv = { ...process.env };
    process.env.TEST_CRED = 'abc';
    const res = findingNoFabrication.run({ findings: [] }, { requiredCredentials: ['TEST_CRED'] });
    expect(res.ok).toBe(false);
    process.env = originalEnv;
  });

  it('Empty findings[] with a missing credential -> pass', () => {
    const originalEnv = { ...process.env };
    delete process.env.TEST_CRED;
    const res = findingNoFabrication.run({ findings: [] }, { requiredCredentials: ['TEST_CRED'] });
    expect(res.ok).toBe(true);
    process.env = originalEnv;
  });
});
