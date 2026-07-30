import { describe, it, expect } from 'vitest';
import { CertificationSuite } from '@seokit/core';
import { accessibilityPlugin } from './index.js';

describe('Accessibility Plugin Certification & Verification', () => {
  it('should pass platform certification', () => {
    const suite = new CertificationSuite();
    const result = suite.certifyPlugin(accessibilityPlugin);
    
    expect(result.errors).toEqual([]);
    expect(result.passed).toBe(true);
  });

  it('should validate HTML lang attributes and generate correct FixPlans', async () => {
    const validators = accessibilityPlugin.validators || [];
    const wcagVal = validators.find(v => v.id === 'wcag-validator');
    const ariaVal = validators.find(v => v.id === 'aria-validator');
    const semanticVal = validators.find(v => v.id === 'semantic-validator');
    const headingVal = validators.find(v => v.id === 'heading-hierarchy-validator');
    const formVal = validators.find(v => v.id === 'accessibility-form-labels-validator');
    const imgVal = validators.find(v => v.id === 'image-alt-validator');
    const interactiveVal = validators.find(v => v.id === 'accessibility-aria-interactive-validator');

    expect(wcagVal).toBeDefined();
    expect(ariaVal).toBeDefined();
    expect(semanticVal).toBeDefined();
    expect(headingVal).toBeDefined();
    expect(formVal).toBeDefined();
    expect(imgVal).toBeDefined();
    expect(interactiveVal).toBeDefined();

    const dummyPlan: any = { capabilityId: 'accessibility.audit', validators: [], context: {} };

    // 1. HTML Lang - Failing Case
    const failLangHtml = '<html><head></head><body></body></html>';
    const langResultFail = await wcagVal!.execute(dummyPlan, { rawHtml: failLangHtml, filePath: 'index.html' });
    expect(langResultFail.passed).toBe(false);
    expect(langResultFail.fixPlan).toBeDefined();
    expect(langResultFail.fixPlan?.ruleId).toBe('accessibility.wcag.lang');
    expect(langResultFail.fixPlan?.suggestedFix).toContain('Add lang="en"');

    // 2. HTML Lang - Passing Case
    const passLangHtml = '<html lang="en"><head></head><body></body></html>';
    const langResultPass = await wcagVal!.execute(dummyPlan, { rawHtml: passLangHtml });
    expect(langResultPass.passed).toBe(true);

    // 3. ARIA - Failing Case (empty role)
    const failAriaHtml = '<html><body><div role=""></div></body></html>';
    const ariaResultFail = await ariaVal!.execute(dummyPlan, { rawHtml: failAriaHtml });
    expect(ariaResultFail.passed).toBe(false);
    expect(ariaResultFail.fixPlan?.ruleId).toBe('accessibility.aria.roles');

    // 4. Semantic HTML - Failing Case
    const failSemanticHtml = '<html><body><div>No header main or footer</div></body></html>';
    const semanticResultFail = await semanticVal!.execute(dummyPlan, { rawHtml: failSemanticHtml });
    expect(semanticResultFail.passed).toBe(false);
    expect(semanticResultFail.fixPlan?.ruleId).toBe('accessibility.semantic.structure');

    // 5. Heading hierarchy - Multiple H1s
    const failHeadingHtml = '<html><body><h1>First</h1><h1>Second</h1></body></html>';
    const headingResultFail = await headingVal!.execute(dummyPlan, { rawHtml: failHeadingHtml });
    expect(headingResultFail.passed).toBe(false);
    expect(headingResultFail.fixPlan?.ruleId).toBe('accessibility.heading.hierarchy');

    // 6. Form labels - Unlabeled inputs
    const failFormHtml = '<html><body><input id="username" type="text" /></body></html>';
    const formResultFail = await formVal!.execute(dummyPlan, { rawHtml: failFormHtml });
    expect(formResultFail.passed).toBe(false);
    expect(formResultFail.fixPlan?.ruleId).toBe('accessibility.form.labels');

    // 7. Image Alt - missing alt
    const failImgHtml = '<html><body><img src="logo.png" /></body></html>';
    const imgResultFail = await imgVal!.execute(dummyPlan, { rawHtml: failImgHtml });
    expect(imgResultFail.passed).toBe(false);
    expect(imgResultFail.fixPlan?.ruleId).toBe('accessibility.images.alt');

    // 8. Custom interactive elements - missing roles and focus tabindex
    const failInteractiveHtml = '<html><body><div onclick="doSomething()">Click me</div></body></html>';
    const interactiveResultFail = await interactiveVal!.execute(dummyPlan, { rawHtml: failInteractiveHtml });
    expect(interactiveResultFail.passed).toBe(false);
    expect(interactiveResultFail.fixPlan?.ruleId).toBe('accessibility.aria.interactive');
    expect(interactiveResultFail.output).toContain('has an onclick handler but no ARIA role');
  });
});
