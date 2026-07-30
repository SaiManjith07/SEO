import { PlatformPlugin } from '@seokit/core';
import { wcagValidator } from './validators/wcag.js';
import { ariaValidator } from './validators/aria.js';
import { semanticValidator } from './validators/semantic.js';
import { headingHierarchyValidator } from './validators/heading.js';
import { accessibilityFormLabelsValidator } from './validators/form-labels.js';
import { accessibilityAriaInteractiveValidator } from './validators/aria-interactive.js';
import { imageAltValidator } from './validators/image.js';

export const accessibilityPlugin: PlatformPlugin = {
  id: 'accessibility',
  version: '1.0.0',
  capabilities: [
    {
      id: 'accessibility.audit',
      version: '1.0.0',
      rules: [
        'accessibility.wcag.lang',
        'accessibility.aria.roles',
        'accessibility.semantic.structure',
        'accessibility.heading.hierarchy',
        'accessibility.form.labels',
        'accessibility.images.alt',
        'accessibility.aria.interactive'
      ],
      validators: [
        'wcag-validator',
        'aria-validator',
        'semantic-validator',
        'heading-hierarchy-validator',
        'accessibility-form-labels-validator',
        'image-alt-validator',
        'accessibility-aria-interactive-validator'
      ],
      frameworkCapabilities: ['accessibility'],
      dependencies: [],
      events: ['AccessibilityAudited']
    }
  ],
  validators: [
    wcagValidator,
    ariaValidator,
    semanticValidator,
    headingHierarchyValidator,
    accessibilityFormLabelsValidator,
    imageAltValidator,
    accessibilityAriaInteractiveValidator
  ],
  rules: [
    {
      id: 'accessibility.wcag.lang',
      name: 'HTML Lang Attribute',
      capabilityId: 'accessibility.audit',
      severity: 'error',
      description: 'The html root element must declare a lang attribute.',
      validatorName: 'wcag-validator',
      autoFix: true,
      version: '1.0.0',
      standard: 'STD-17'
    },
    {
      id: 'accessibility.aria.roles',
      name: 'Valid ARIA Roles',
      capabilityId: 'accessibility.audit',
      severity: 'error',
      description: 'Ensure role attributes feature non-empty values.',
      validatorName: 'aria-validator',
      autoFix: true,
      version: '1.0.0',
      standard: 'STD-08'
    },
    {
      id: 'accessibility.semantic.structure',
      name: 'Semantic Containers',
      capabilityId: 'accessibility.audit',
      severity: 'warning',
      description: 'Page features main, header, and footer containers.',
      validatorName: 'semantic-validator',
      autoFix: true,
      version: '1.0.0',
      standard: 'STD-13'
    },
    {
      id: 'accessibility.heading.hierarchy',
      name: 'Heading Hierarchy Sequence',
      capabilityId: 'accessibility.audit',
      severity: 'warning',
      description: 'headings must follow a logical sequential order.',
      validatorName: 'heading-hierarchy-validator',
      autoFix: true,
      version: '1.0.0',
      standard: 'STD-12'
    },
    {
      id: 'accessibility.form.labels',
      name: 'Accessible Form Input Control Labels',
      capabilityId: 'accessibility.audit',
      severity: 'error',
      description: 'Form inputs must have descriptive associated label text.',
      validatorName: 'accessibility-form-labels-validator',
      autoFix: true,
      version: '1.0.0',
      standard: 'STD-13'
    },
    {
      id: 'accessibility.images.alt',
      name: 'Image Alternative Text Description',
      capabilityId: 'accessibility.audit',
      severity: 'error',
      description: 'Image elements must declare alt tags.',
      validatorName: 'image-alt-validator',
      autoFix: true,
      version: '1.0.0',
      standard: 'STD-17'
    },
    {
      id: 'accessibility.aria.interactive',
      name: 'Custom Interactive ARIA Controls Keyboard Support',
      capabilityId: 'accessibility.audit',
      severity: 'error',
      description: 'Interactive elements must feature tabindex and role characteristics.',
      validatorName: 'accessibility-aria-interactive-validator',
      autoFix: true,
      version: '1.0.0',
      standard: 'STD-17'
    }
  ]
};
