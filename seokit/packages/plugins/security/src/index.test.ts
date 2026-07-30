import { describe, it, expect } from 'vitest';
import { securityPlugin } from './index.js';

describe('SEOKit Security Plugin Checks', () => {
  const mockPlan: any = {
    capabilityId: 'security.headers',
    validators: ['security-headers-validator'],
    context: {}
  };

  it('should validate successfully when all security headers are defined', async () => {
    const validator = securityPlugin.validators!.find((v: any) => v.id === 'security-headers-validator');
    expect(validator).toBeDefined();

    const context = {
      headers: {
        'content-security-policy': "default-src 'self'",
        'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
        'x-frame-options': 'DENY'
      }
    };

    const result = await validator!.execute(mockPlan, context);
    expect(result.passed).toBe(true);
    expect(result.output).toBe('All security headers are verified.');
  });

  it('should fail validation when CSP or HSTS headers are missing', async () => {
    const validator = securityPlugin.validators!.find((v: any) => v.id === 'security-headers-validator');
    expect(validator).toBeDefined();

    const context = {
      headers: {
        'x-frame-options': 'DENY'
      }
    };

    const result = await validator!.execute(mockPlan, context);
    expect(result.passed).toBe(false);
    expect(result.output).toContain('Missing Content-Security-Policy header.');
    expect(result.output).toContain('Missing Strict-Transport-Security (HSTS) header.');
  });
});
