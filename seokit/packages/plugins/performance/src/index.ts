import { PlatformPlugin } from '@seokit/core';
import { lighthouseValidator } from './validators/lighthouse.js';
import { webvitalsValidator } from './validators/webvitals.js';
import { bundleValidator } from './validators/bundle.js';
import { imageValidator } from './validators/image.js';
import { fontValidator } from './validators/font.js';
import { renderblockingValidator } from './validators/renderblocking.js';
import { compressionValidator } from './validators/compression.js';

export const performancePlugin: PlatformPlugin = {
  id: 'performance',
  version: '1.0.0',
  capabilities: [
    {
      id: 'performance.audit',
      version: '1.0.0',
      rules: [
        'performance.lighthouse.score',
        'performance.webvitals.lcp',
        'performance.webvitals.cls',
        'performance.webvitals.inp',
        'performance.bundle.size',
        'performance.images.optimized',
        'performance.fonts.optimized',
        'performance.resources.renderblocking',
        'performance.compression.caching'
      ],
      validators: [
        'lighthouse-validator',
        'webvitals-validator',
        'bundle-validator',
        'image-validator',
        'font-validator',
        'renderblocking-validator',
        'compression-validator'
      ],
      frameworkCapabilities: ['performance'],
      dependencies: [],
      events: ['PerformanceAudited']
    }
  ],
  validators: [
    lighthouseValidator,
    webvitalsValidator,
    bundleValidator,
    imageValidator,
    fontValidator,
    renderblockingValidator,
    compressionValidator
  ],
  rules: [
    {
      id: 'performance.lighthouse.score',
      name: 'Lighthouse Target Score',
      capabilityId: 'performance.audit',
      severity: 'error',
      description: 'Ensure Lighthouse performance metrics satisfy targets.',
      validatorName: 'lighthouse-validator',
      autoFix: false,
      version: '1.0.0'
    },
    {
      id: 'performance.webvitals.lcp',
      name: 'Web Vitals LCP',
      capabilityId: 'performance.audit',
      severity: 'error',
      description: 'Largest Contentful Paint must be under 2.5s.',
      validatorName: 'webvitals-validator',
      autoFix: false,
      version: '1.0.0'
    },
    {
      id: 'performance.webvitals.cls',
      name: 'Web Vitals CLS',
      capabilityId: 'performance.audit',
      severity: 'error',
      description: 'Cumulative Layout Shift must be under 0.1.',
      validatorName: 'webvitals-validator',
      autoFix: false,
      version: '1.0.0'
    },
    {
      id: 'performance.webvitals.inp',
      name: 'Web Vitals INP',
      capabilityId: 'performance.audit',
      severity: 'warning',
      description: 'Interaction to Next Paint must be under 200ms.',
      validatorName: 'webvitals-validator',
      autoFix: false,
      version: '1.0.0'
    },
    {
      id: 'performance.bundle.size',
      name: 'Javascript Bundle Weight',
      capabilityId: 'performance.audit',
      severity: 'warning',
      description: 'Limit page bundle script tags counts.',
      validatorName: 'bundle-validator',
      autoFix: false,
      version: '1.0.0'
    },
    {
      id: 'performance.images.optimized',
      name: 'Image Optimization',
      capabilityId: 'performance.audit',
      severity: 'warning',
      description: 'Verify dimensions, lazy load status, and modern image formats.',
      validatorName: 'image-validator',
      autoFix: true,
      version: '1.0.0'
    },
    {
      id: 'performance.fonts.optimized',
      name: 'Font Preloading',
      capabilityId: 'performance.audit',
      severity: 'warning',
      description: 'Ensure fonts are preloaded to reduce shift.',
      validatorName: 'font-validator',
      autoFix: true,
      version: '1.0.0'
    },
    {
      id: 'performance.resources.renderblocking',
      name: 'Render Blocking scripts',
      capabilityId: 'performance.audit',
      severity: 'error',
      description: 'Eliminate render blocking scripts from head.',
      validatorName: 'renderblocking-validator',
      autoFix: true,
      version: '1.0.0'
    },
    {
      id: 'performance.compression.caching',
      name: 'Payload compression and cache headers',
      capabilityId: 'performance.audit',
      severity: 'warning',
      description: 'Define Cache-Control headers and payload compression features.',
      validatorName: 'compression-validator',
      autoFix: false,
      version: '1.0.0'
    }
  ]
};
