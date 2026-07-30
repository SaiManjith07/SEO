import { describe, it, expect } from 'vitest';
import { VerificationEngine } from './verification.js';
import { CapabilityRegistry } from './capabilities.js';
import { ValidatorRegistry } from './validators.js';
import { RuleRegistry } from './rules.js';

function getTestEngine(): VerificationEngine {
  const capRegistry = new CapabilityRegistry();
  const valRegistry = new ValidatorRegistry();
  const ruleRegistry = new RuleRegistry();

  capRegistry.registerCapability({
    id: 'html.audit',
    version: '1.0.0',
    rules: ['seo.metadata.exists'],
    validators: ['html-validator'],
    frameworkCapabilities: [],
    dependencies: [],
    events: []
  });

  ruleRegistry.registerRule({
    id: 'seo.metadata.exists',
    name: 'Metadata Check',
    capabilityId: 'html.audit',
    severity: 'error',
    description: 'Verify title and meta tags',
    validatorName: 'html-validator',
    autoFix: false,
    version: '1.0.0'
  });

  return new VerificationEngine(capRegistry, valRegistry, ruleRegistry);
}

describe('SEOKit Verification Stability & Resiliency Gates', () => {
  it('should gracefully handle completely broken and malformed HTML without crashing', async () => {
    const engine = getTestEngine();
    const context = {
      rawHtml: '<<<<<<<<<<<<<<<<<<tag missing="" closing="""""""">>></>',
      filePath: '/broken.html',
      robotsTxt: '',
      sitemapXml: ''
    };

    const result = await engine.verifyProject(context);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    const hasFailures = result.some(r => !r.passed);
    expect(hasFailures).toBe(true);
  });

  it('should handle completely empty pages and contexts cleanly', async () => {
    const engine = getTestEngine();
    const context = {
      rawHtml: '',
      filePath: '/empty.html',
      robotsTxt: '',
      sitemapXml: ''
    };

    const result = await engine.verifyProject(context);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  it('should verify rules output formatted diagnostics successfully for validation issues', async () => {
    const engine = getTestEngine();
    const context = {
      rawHtml: '<html><head><title>Simple page</title></head><body>No meta description</body></html>',
      filePath: '/page.html',
      robotsTxt: '',
      sitemapXml: ''
    };

    const result = await engine.verifyProject(context);
    const htmlValidation = result.find(r => r.source === 'html-validator');
    expect(htmlValidation).toBeDefined();
    expect(htmlValidation?.passed).toBe(false);
    expect(htmlValidation?.output).toContain('Missing meta description');
  });
});
