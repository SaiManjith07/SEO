import { describe, it, expect } from 'vitest';
import { VerificationEngine } from './verification.js';
import { CapabilityRegistry } from './capabilities.js';
import { ValidatorRegistry, ExecutionPlan } from './validators.js';
import { RuleRegistry } from './rules.js';

describe('SEOKit Core Rule-by-Rule & Plugin Isolation Regressions', () => {
  it('should validate html-validator outputs correctly', async () => {
    const engine = new VerificationEngine();
    
    // Test passing HTML
    const passingCtx = {
      rawHtml: '<html><head><title>Test Title</title><meta name="description" content="Valid description page"></head></html>'
    };
    const validatorFn = (engine as any).validators.get('html-validator');
    expect(validatorFn).toBeDefined();

    const passRes = await validatorFn(passingCtx);
    expect(passRes.passed).toBe(true);

    // Test failing HTML
    const failingCtx = {
      rawHtml: '<html><head></head></html>'
    };
    const failRes = await validatorFn(failingCtx);
    expect(failRes.passed).toBe(false);
    expect(failRes.output).toContain('Missing page <title>');
    expect(failRes.output).toContain('Missing meta description');
  });

  it('should validate canonical-validator absolute URL rules', async () => {
    const engine = new VerificationEngine();
    const validatorFn = (engine as any).validators.get('canonical-validator');
    expect(validatorFn).toBeDefined();

    // Absolute canonical matches
    const absoluteRes = await validatorFn({
      rawHtml: '<html><head><link rel="canonical" href="https://example.com/valid-path"></head></html>'
    });
    expect(absoluteRes.passed).toBe(true);

    // Relative/missing canonical matches
    const relativeRes = await validatorFn({
      rawHtml: '<html><head><link rel="canonical" href="/relative-path"></head></html>'
    });
    expect(relativeRes.passed).toBe(false);
  });

  it('should validate performance-validator calculations correctly', async () => {
    const engine = new VerificationEngine();
    const validatorFn = (engine as any).validators.get('performance-validator');
    expect(validatorFn).toBeDefined();

    const normalRes = await validatorFn({
      rawHtml: '<html><body><img src="pic.png" width="200" height="200" loading="lazy"></body></html>'
    });
    expect(normalRes.passed).toBe(true);

    const badPerformanceRes = await validatorFn({
      // Many scripts and un-dimensioned images
      rawHtml: `<html><body>
        <script src="1.js"></script><script src="2.js"></script><script src="3.js"></script>
        <script src="4.js"></script><script src="5.js"></script><script src="6.js"></script>
        <img src="1.png">
        <img src="2.png">
        <img src="3.png">
      </body></html>`
    });
    expect(badPerformanceRes.passed).toBe(false);
  });

  it('should isolate exceptions thrown from plugin execution and proceed without crashing', async () => {
    const capRegistry = new CapabilityRegistry();
    const valRegistry = new ValidatorRegistry();
    const ruleRegistry = new RuleRegistry();

    // Register a broken plugin validator that always throws an error
    valRegistry.registerValidator({
      id: 'broken-validator-plugin',
      version: '1.0.0',
      execute: async () => {
        throw new Error('Internal database failure or mock crash');
      }
    });

    // Register valid validator that behaves normally
    valRegistry.registerValidator({
      id: 'stable-validator-plugin',
      version: '1.0.0',
      execute: async () => {
        return { passed: true, confidence: 1.0, output: 'Stable validator works', source: 'stable-validator-plugin' };
      }
    });

    // Register capabilities running both stable and broken plugins
    capRegistry.registerCapability({
      id: 'mixed.capability',
      version: '1.0.0',
      rules: ['mixed.rule.broken', 'mixed.rule.stable'],
      validators: ['broken-validator-plugin', 'stable-validator-plugin'],
      frameworkCapabilities: [],
      dependencies: [],
      events: []
    });

    ruleRegistry.registerRule({
      id: 'mixed.rule.broken',
      name: 'Broken Rule',
      capabilityId: 'mixed.capability',
      severity: 'error',
      description: 'Rule validated by the broken plugin',
      validatorName: 'broken-validator-plugin',
      autoFix: false,
      version: '1.0.0'
    });

    ruleRegistry.registerRule({
      id: 'mixed.rule.stable',
      name: 'Stable Rule',
      capabilityId: 'mixed.capability',
      severity: 'warning',
      description: 'Rule validated by the stable plugin',
      validatorName: 'stable-validator-plugin',
      autoFix: false,
      version: '1.0.0'
    });

    const engine = new VerificationEngine(capRegistry, valRegistry, ruleRegistry);
    const context = { rawHtml: '<html></html>' };

    // Run verification sweep
    let results: any[] = [];
    expect(() => {
      // Execute capability should complete successfully despite plugin crash
      results = [];
    }).not.toThrow();

    results = await engine.executeCapability('mixed.capability', context);

    expect(results.length).toBe(2);

    const brokenEvidence = results.find(r => r.source === 'broken-validator-plugin');
    const stableEvidence = results.find(r => r.source === 'stable-validator-plugin');

    expect(brokenEvidence).toBeDefined();
    expect(brokenEvidence?.passed).toBe(false);
    expect(brokenEvidence?.output).toContain('ERROR: Validator \'broken-validator-plugin\' failed: Internal database failure or mock crash');

    expect(stableEvidence).toBeDefined();
    expect(stableEvidence?.passed).toBe(true);
    expect(stableEvidence?.output).toBe('Stable validator works');
  });
});
