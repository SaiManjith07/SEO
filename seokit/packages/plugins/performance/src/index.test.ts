import { describe, it, expect } from 'vitest';
import { CertificationSuite } from '@seokit/core';
import { performancePlugin } from './index.js';

describe('Performance Plugin Certification & Verification', () => {
  it('should pass platform certification', () => {
    const suite = new CertificationSuite();
    const result = suite.certifyPlugin(performancePlugin);
    
    expect(result.errors).toEqual([]);
    expect(result.passed).toBe(true);
  });

  it('should validate Lighthouse, Web Vitals, and Bundle size using validators', async () => {
    const validators = performancePlugin.validators || [];
    const lhVal = validators.find(v => v.id === 'lighthouse-validator');
    const wvVal = validators.find(v => v.id === 'webvitals-validator');
    const bdVal = validators.find(v => v.id === 'bundle-validator');
    const imgVal = validators.find(v => v.id === 'image-validator');
    const compressionVal = validators.find(v => v.id === 'compression-validator');

    expect(lhVal).toBeDefined();
    expect(wvVal).toBeDefined();
    expect(bdVal).toBeDefined();
    expect(imgVal).toBeDefined();
    expect(compressionVal).toBeDefined();

    const dummyPlan: any = { capabilityId: 'performance.audit', validators: [], context: {} };

    // 1. Lighthouse
    const lhResult = await lhVal!.execute(dummyPlan, { performanceScore: 95 });
    expect(lhResult.passed).toBe(true);
    expect(lhResult.output).toContain('lighthouse');

    // 2. Web Vitals
    const wvResult = await wvVal!.execute(dummyPlan, { lcp: 1.8, cls: 0.05, inp: 120 });
    expect(wvResult.passed).toBe(true);
    expect(wvResult.output).toContain('webVitals');

    // 3. Bundle
    const bdResult = await bdVal!.execute(dummyPlan, { rawHtml: '<html><body><script src="a.js"></script></body></html>' });
    expect(bdResult.passed).toBe(true);

    // 4. Image
    const imgResult = await imgVal!.execute(dummyPlan, { rawHtml: '<html><body><img src="a.png" width="100" height="100" /></body></html>' });
    expect(imgResult.passed).toBe(false);
    expect(imgResult.output).toContain('modern WebP/AVIF');

    // 5. Compression
    const compResult = await compressionVal!.execute(dummyPlan, { mockCompressed: true, mockCached: true });
    expect(compResult.passed).toBe(true);
  });
});
