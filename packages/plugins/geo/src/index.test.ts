import { describe, it, expect } from 'vitest';
import { CertificationSuite } from '@seokit/core';
import { geoPlugin } from './index.js';

describe('GEO Plugin Certification & Verification', () => {
  it('should pass platform certification', () => {
    const suite = new CertificationSuite();
    const result = suite.certifyPlugin(geoPlugin);
    
    expect(result.errors).toEqual([]);
    expect(result.passed).toBe(true);
  });

  it('should validate organization schema, author meta, and outbound citation references', async () => {
    const validators = geoPlugin.validators || [];
    const orgVal = validators.find(v => v.id === 'geo-org-validator');
    const authorVal = validators.find(v => v.id === 'geo-author-validator');
    const citationVal = validators.find(v => v.id === 'geo-citation-validator');
    const geoVal = validators.find(v => v.id === 'geo-geographic-validator');
    const kgVal = validators.find(v => v.id === 'geo-knowledge-validator');
    const provVal = validators.find(v => v.id === 'geo-provenance-validator');
    const statVal = validators.find(v => v.id === 'geo-statistics-validator');
    const quoteVal = validators.find(v => v.id === 'geo-quotes-validator');

    expect(orgVal).toBeDefined();
    expect(authorVal).toBeDefined();
    expect(citationVal).toBeDefined();
    expect(geoVal).toBeDefined();
    expect(kgVal).toBeDefined();
    expect(provVal).toBeDefined();
    expect(statVal).toBeDefined();
    expect(quoteVal).toBeDefined();

    const dummyPlan: any = { capabilityId: 'geo.audit', validators: [], context: {} };

    // 1. Organization Schema - Failing Case
    const failOrgHtml = '<html><body></body></html>';
    const orgResFail = await orgVal!.execute(dummyPlan, { rawHtml: failOrgHtml, filePath: 'index.html' });
    expect(orgResFail.passed).toBe(false);
    expect(orgResFail.fixPlan?.ruleId).toBe('geo.org.schema');

    // 2. Author Attribution - Failing Case
    const authorResFail = await authorVal!.execute(dummyPlan, { rawHtml: failOrgHtml, filePath: 'index.html' });
    expect(authorResFail.passed).toBe(false);
    expect(authorResFail.fixPlan?.ruleId).toBe('geo.author.attribution');

    // 3. Outbound Citations - Failing Case
    const citationResFail = await citationVal!.execute(dummyPlan, { rawHtml: failOrgHtml, filePath: 'index.html' });
    expect(citationResFail.passed).toBe(false);
    expect(citationResFail.fixPlan?.ruleId).toBe('geo.citation.markup');

    // 4. Geographic Entity - Failing Case
    const geoResFail = await geoVal!.execute(dummyPlan, { rawHtml: failOrgHtml, filePath: 'index.html' });
    expect(geoResFail.passed).toBe(false);
    expect(geoResFail.fixPlan?.ruleId).toBe('geo.geographic.address');

    // 5. Knowledge Graph Signals - Failing Case
    const kgResFail = await kgVal!.execute(dummyPlan, { rawHtml: failOrgHtml, filePath: 'index.html' });
    expect(kgResFail.passed).toBe(false);
    expect(kgResFail.fixPlan?.ruleId).toBe('geo.knowledge.sameas');

    // 6. Content Provenance - Failing Case
    const provResFail = await provVal!.execute(dummyPlan, { rawHtml: failOrgHtml, filePath: 'index.html' });
    expect(provResFail.passed).toBe(false);
    expect(provResFail.fixPlan?.ruleId).toBe('geo.provenance.dates');

    // 7. Statistics Density - Failing Case
    const statResFail = await statVal!.execute(dummyPlan, { rawHtml: '<html><body>Low statistics count. Only 1 number.</body></html>', filePath: 'index.html' });
    expect(statResFail.passed).toBe(false);
    expect(statResFail.fixPlan?.ruleId).toBe('geo.statistics.density');

    // 8. Named Quotes - Failing Case
    const quoteResFail = await quoteVal!.execute(dummyPlan, { rawHtml: '<html><body>No quotes here.</body></html>', filePath: 'index.html' });
    expect(quoteResFail.passed).toBe(false);
    expect(quoteResFail.fixPlan?.ruleId).toBe('geo.quotes.authority');
  });
});
