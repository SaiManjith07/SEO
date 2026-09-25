import { ExecutionPlan, VerificationEvidence, ValidatorPlugin, FixPlan } from '@seokit/core';
import * as cheerio from 'cheerio';

export const accessibilityAriaInteractiveValidator: ValidatorPlugin = {
  id: 'accessibility-aria-interactive-validator',
  version: '1.0.0',
  async execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence> {
    const html = context.rawHtml || context.pageHtml || '';
    if (!html) {
      return { passed: true, confidence: 1.0, output: 'No HTML available.', source: 'accessibility-aria-interactive-validator' };
    }

    const $ = cheerio.load(html);
    const nativeInteractive = ['a', 'button', 'input', 'select', 'textarea'];
    const failures: string[] = [];

    // Query all elements containing custom onclick listeners or explicit interactive roles
    $('[onclick], [role="button"], [role="link"], [role="checkbox"], [role="menuitem"], [role="tab"]').each((_, el) => {
      if (nativeInteractive.includes(el.name.toLowerCase())) {
        return; // Ignore native controls as they have default keyboard support and focusability
      }

      const role = $(el).attr('role') ?? '';
      const onclick = $(el).attr('onclick') ?? '';
      const tabindex = $(el).attr('tabindex');

      // 1. Interactive role declaration check
      if (onclick && !role) {
        failures.push(`Non-native interactive element <${el.name}> has an onclick handler but no ARIA role (e.g. role="button").`);
      }

      // 2. Keyboard focusability check
      if ((onclick || role) && (tabindex === undefined || tabindex === null)) {
        failures.push(`Custom interactive control <${el.name}> with role="${role || 'button'}" is not keyboard focusable (missing tabindex).`);
      }

      // 3. Accessible label check
      const labelText = $(el).text().trim();
      const ariaLabel = $(el).attr('aria-label');
      const ariaLabelledby = $(el).attr('aria-labelledby');
      if (!labelText && !ariaLabel && !ariaLabelledby) {
        failures.push(`Custom interactive control <${el.name}> is missing an accessible text label or ARIA descriptor.`);
      }
    });

    if (failures.length > 0) {
      const fix: FixPlan = {
        ruleId: 'accessibility.aria.interactive',
        description: 'Custom non-native interactive elements must declare keyboard accessibility (tabindex="0") and ARIA roles/labels.',
        suggestedFix: 'Add tabindex="0", role="button" (or similar), and an aria-label attribute to custom interactive elements.',
        targetFile: context.filePath
      };

      return {
        passed: false,
        confidence: 1.0,
        output: `Accessibility Failure: ${failures.join(' | ')}`,
        source: 'accessibility-aria-interactive-validator',
        fixPlan: fix
      };
    }

    return {
      passed: true,
      confidence: 1.0,
      output: 'All custom interactive element ARIA and focus configurations are valid.',
      source: 'accessibility-aria-interactive-validator'
    };
  }
};
