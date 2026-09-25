import { PlatformPlugin, PluginRegistry } from '@seokit/core';
import * as cheerio from 'cheerio';

export const securityPlugin: PlatformPlugin = {
  id: 'security',
  version: '1.0.0',
  capabilities: [
    {
      id: 'security.headers',
      version: '1.0.0',
      rules: ['security.headers.csp', 'security.headers.hsts', 'security.headers.xframe'],
      validators: ['security-headers-validator'],
      frameworkCapabilities: [],
      dependencies: [],
      events: ['SecurityHeadersVerified']
    }
  ],
  validators: [
    {
      id: 'security-headers-validator',
      version: '1.0.0',
      async execute(plan: any, context: any) {
        const headers = context.headers || {};
        const errors: string[] = [];

        // 1. Content-Security-Policy (CSP)
        const csp = headers['content-security-policy'] || headers['Content-Security-Policy'];
        if (!csp) {
          errors.push('Missing Content-Security-Policy header.');
        }

        // 2. Strict-Transport-Security (HSTS)
        const hsts = headers['strict-transport-security'] || headers['Strict-Transport-Security'];
        if (!hsts) {
          errors.push('Missing Strict-Transport-Security (HSTS) header.');
        }

        // 3. X-Frame-Options (Clickjacking defense)
        const xframe = headers['x-frame-options'] || headers['X-Frame-Options'];
        if (!xframe) {
          errors.push('Missing X-Frame-Options clickjacking defense header.');
        }

        return {
          passed: errors.length === 0,
          confidence: 1.0,
          output: errors.length === 0 ? 'All security headers are verified.' : errors.join(' '),
          source: 'security-headers-validator'
        };
      }
    }
  ],
  rules: [
    {
      id: 'security.headers.csp',
      name: 'Content Security Policy (CSP)',
      capabilityId: 'security.headers',
      severity: 'error',
      description: 'Ensure CSP headers are present to block cross-site scripting (XSS) actions.',
      validatorName: 'security-headers-validator',
      autoFix: false,
      version: '1.0.0'
    },
    {
      id: 'security.headers.hsts',
      name: 'Strict Transport Security (HSTS)',
      capabilityId: 'security.headers',
      severity: 'error',
      description: 'Ensure HSTS headers are present to enforce HTTPS connections.',
      validatorName: 'security-headers-validator',
      autoFix: false,
      version: '1.0.0'
    },
    {
      id: 'security.headers.xframe',
      name: 'X-Frame Options',
      capabilityId: 'security.headers',
      severity: 'warning',
      description: 'Ensure X-Frame-Options or frame-ancestors are defined to defend against clickjacking.',
      validatorName: 'security-headers-validator',
      autoFix: false,
      version: '1.0.0'
    }
  ]
};

PluginRegistry.register(securityPlugin);
