import { describe, it, expect } from 'vitest';
import { VerificationEngine } from './verification.js';
import { CapabilityRegistry } from './capabilities.js';
import { ValidatorRegistry } from './validators.js';
import { RuleRegistry } from './rules.js';

function getStressEngine(): VerificationEngine {
  const capRegistry = new CapabilityRegistry();
  const valRegistry = new ValidatorRegistry();
  const ruleRegistry = new RuleRegistry();

  capRegistry.registerCapability({
    id: 'stress.audit',
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
    capabilityId: 'stress.audit',
    severity: 'error',
    description: 'Verify title and meta tags',
    validatorName: 'html-validator',
    autoFix: false,
    version: '1.0.0'
  });

  return new VerificationEngine(capRegistry, valRegistry, ruleRegistry);
}

describe('SEOKit Concurrency and Scale Stress Verification', () => {
  it('should stably execute 1000 page verifications concurrently without crashing', async () => {
    const engine = getStressEngine();
    const pageCount = 1000;
    const promises: Promise<any[]>[] = [];

    for (let i = 0; i < pageCount; i++) {
      const context = {
        rawHtml: `<html><head><title>Page ${i}</title><meta name="description" content="Description ${i}"></head><body>Valid content</body></html>`,
        filePath: `/page-${i}.html`,
        robotsTxt: '',
        sitemapXml: ''
      };
      promises.push(engine.verifyProject(context));
    }

    const allResults = await Promise.all(promises);
    expect(allResults.length).toBe(pageCount);

    // Verify all pages completed and registered passing values
    for (const res of allResults) {
      expect(res.length).toBe(1);
      expect(res[0].passed).toBe(true);
    }
  });
});
