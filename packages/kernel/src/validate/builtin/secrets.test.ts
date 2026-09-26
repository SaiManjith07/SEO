import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { reportNoSecrets } from './secrets.js';

describe('report.noSecrets', () => {
  const originalEnv = { ...process.env };
  
  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('passes on clean report', () => {
    const res = reportNoSecrets.run({ content: 'looks good' }, {});
    expect(res.ok).toBe(true);
  });

  it('fails when regex pattern matched', () => {
    const res = reportNoSecrets.run({ content: 'sk-abcdefghijklmnopqrstuvwxyz' }, {});
    expect(res.ok).toBe(false);
    expect((res as any).message).toMatch(/secret matching pattern/);
  });

  it('fails when env var leaked', () => {
    process.env.MY_SECRET_KEY = 'super-secret-value';
    const res = reportNoSecrets.run({ content: 'Here is the data: super-secret-value' }, {});
    expect(res.ok).toBe(false);
    expect((res as any).message).toMatch(/leaked env variable: MY_SECRET_KEY/);
  });
});
