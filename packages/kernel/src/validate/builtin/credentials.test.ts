import { describe, it, expect, vi } from 'vitest';
import { credentialsPresent, credentialsValid } from './credentials.js';

describe('credentials.present', () => {
  it('passes when credentials are present', () => {
    process.env.TEST_CRED = 'abc';
    const res = credentialsPresent.run({}, { requiredCredentials: ['TEST_CRED'] });
    expect(res.ok).toBe(true);
  });

  it('fails when credential is missing', () => {
    delete process.env.TEST_CRED;
    const res = credentialsPresent.run({}, { requiredCredentials: ['TEST_CRED'] });
    expect(res.ok).toBe(false);
    expect((res as any).message).toMatch(/TEST_CRED/);
  });
});

describe('credentials.valid', () => {
  it('passes valid CRUX_API_KEY', () => {
    process.env.CRUX_API_KEY = 'AIza12345678901234567890';
    const res = credentialsValid.run({}, { requiredCredentials: ['CRUX_API_KEY'] });
    expect(res.ok).toBe(true);
  });

  it('fails invalid CRUX_API_KEY', () => {
    process.env.CRUX_API_KEY = 'invalid';
    const res = credentialsValid.run({}, { requiredCredentials: ['CRUX_API_KEY'] });
    expect(res.ok).toBe(false);
    expect((res as any).message).toMatch(/CRUX_API_KEY/);
  });
});
