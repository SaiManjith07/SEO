import { ExecutionPlan, VerificationEvidence, ValidatorPlugin, FixPlan } from '@seokit/core';
import * as cheerio from 'cheerio';

export const accessibilityFormLabelsValidator: ValidatorPlugin = {
  id: 'accessibility-form-labels-validator',
  version: '1.0.0',
  async execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence> {
    const html = context.rawHtml || context.pageHtml || '';
    if (!html) {
      return { passed: true, confidence: 1.0, output: 'No HTML available.', source: 'accessibility-form-labels-validator' };
    }

    const $ = cheerio.load(html);
    const inputs = $('input, textarea, select');
    const failures: string[] = [];

    inputs.each((_, el) => {
      const type = $(el).attr('type') ?? '';
      if (['hidden', 'submit', 'button', 'image'].includes(type.toLowerCase())) {
        return; // Ignore controls that do not require standard text labels
      }

      const id = $(el).attr('id');
      const ariaLabel = $(el).attr('aria-label');
      const ariaLabelledby = $(el).attr('aria-labelledby');

      // Check if wrapped in <label>
      const hasParentLabel = $(el).closest('label').length > 0;

      // Check if referenced by <label for="id">
      let hasReferencingLabel = false;
      if (id) {
        hasReferencingLabel = $(`label[for="${id}"]`).length > 0;
      }

      if (!hasParentLabel && !hasReferencingLabel && !ariaLabel && !ariaLabelledby) {
        const inputDesc = id ? `id="${id}"` : `type="${type || 'text'}"`;
        failures.push(`Input element <${el.name} ${inputDesc}> is missing an associated label or ARIA descriptor.`);
      }
    });

    if (failures.length > 0) {
      const fix: FixPlan = {
        ruleId: 'accessibility.form.labels',
        description: 'Form controls must have accessible text labels matching WCAG 2.1 Criterion 1.1.1 and 3.3.2.',
        suggestedFix: 'Incorporate a <label for="input-id"> element matching the input ID, wrap the input within a <label> element, or add an aria-label attribute.',
        targetFile: context.filePath
      };

      return {
        passed: false,
        confidence: 1.0,
        output: `Accessibility Failure: ${failures.join(' | ')}`,
        source: 'accessibility-form-labels-validator',
        fixPlan: fix
      };
    }

    return {
      passed: true,
      confidence: 1.0,
      output: 'All form controls are correctly bound to accessible text labels.',
      source: 'accessibility-form-labels-validator'
    };
  }
};
