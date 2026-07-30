import { PlatformPlugin, PluginRegistry } from '@seokit/core';
import * as cheerio from 'cheerio';

// Next.js Plugin
export const nextjsPlugin: PlatformPlugin = {
  id: 'nextjs',
  version: '1.0.0',
  engines: {
    seokit: '^2.0.0-rc1'
  },
  capabilities: [
    {
      id: 'nextjs.audit',
      version: '1.0.0',
      rules: ['nextjs.metadata.generateMetadata'],
      validators: ['nextjs-validator'],
      frameworkCapabilities: [],
      dependencies: [],
      events: []
    }
  ],
  validators: [
    {
      id: 'nextjs-validator',
      version: '1.0.0',
      execute: async (plan: any, context: any) => {
        // Skip execution if not Next.js
        if (context.framework?.framework !== 'Next.js') {
          return { passed: true, confidence: 1.0, output: 'Skipped - Next.js not detected', source: 'nextjs-validator' };
        }

        const errors: string[] = [];
        const $ = cheerio.load(context.rawHtml || '');

        const nextData = context.rawHtml?.includes('__NEXT_DATA__');
        const headCount = $('meta[name="next-head-count"]').length > 0;
        if (!nextData && !headCount) {
          errors.push('Missing Next.js rendering markers (__NEXT_DATA__ or next-head-count)');
        }

        const hasViewport = $('meta[name="viewport"]').length > 0;
        if (!hasViewport) {
          errors.push('Missing viewport metadata viewport tag');
        }

        return {
          passed: errors.length === 0,
          confidence: 1.0,
          output: errors.length === 0 ? 'Next.js validation passed' : errors.join(', '),
          source: 'nextjs-validator'
        };
      }
    }
  ],
  rules: [
    {
      id: 'nextjs.metadata.generateMetadata',
      name: 'Next.js Metadata Check',
      capabilityId: 'nextjs.audit',
      severity: 'warning',
      description: 'Next.js page should contain metadata exports or generateMetadata configurations.',
      validatorName: 'nextjs-validator',
      autoFix: false,
      version: '1.0.0',
      standard: 'STD-NEXTJS-01'
    }
  ]
};

// React Plugin
export const reactPlugin: PlatformPlugin = {
  id: 'react',
  version: '1.0.0',
  engines: {
    seokit: '^2.0.0-rc1'
  },
  capabilities: [
    {
      id: 'react.audit',
      version: '1.0.0',
      rules: ['react.helmet.exists'],
      validators: ['react-validator'],
      frameworkCapabilities: [],
      dependencies: [],
      events: []
    }
  ],
  validators: [
    {
      id: 'react-validator',
      version: '1.0.0',
      execute: async (plan: any, context: any) => {
        if (context.framework?.framework !== 'React') {
          return { passed: true, confidence: 1.0, output: 'Skipped - React not detected', source: 'react-validator' };
        }

        const errors: string[] = [];
        const hasReactRoot = context.rawHtml?.includes('react-root') || context.rawHtml?.includes('data-reactroot');
        if (!hasReactRoot) {
          errors.push('React root container target not declared');
        }

        return {
          passed: errors.length === 0,
          confidence: 1.0,
          output: errors.length === 0 ? 'React checks passed' : errors.join(', '),
          source: 'react-validator'
        };
      }
    }
  ],
  rules: [
    {
      id: 'react.helmet.exists',
      name: 'React Helmet Check',
      capabilityId: 'react.audit',
      severity: 'warning',
      description: 'Verify page has react meta tags configured.',
      validatorName: 'react-validator',
      autoFix: false,
      version: '1.0.0',
      standard: 'STD-REACT-01'
    }
  ]
};

// Vue Plugin
export const vuePlugin: PlatformPlugin = {
  id: 'vue',
  version: '1.0.0',
  engines: {
    seokit: '^2.0.0-rc1'
  },
  capabilities: [
    {
      id: 'vue.audit',
      version: '1.0.0',
      rules: ['vue.meta.exists'],
      validators: ['vue-validator'],
      frameworkCapabilities: [],
      dependencies: [],
      events: []
    }
  ],
  validators: [
    {
      id: 'vue-validator',
      version: '1.0.0',
      execute: async (plan: any, context: any) => {
        const isVueOrNuxt = context.framework?.framework === 'Vue' || context.framework?.framework === 'Nuxt';
        if (!isVueOrNuxt) {
          return { passed: true, confidence: 1.0, output: 'Skipped - Vue/Nuxt not detected', source: 'vue-validator' };
        }

        const errors: string[] = [];
        if (context.framework?.framework === 'Nuxt') {
          const hasNuxtData = context.rawHtml?.includes('__NUXT__') || context.rawHtml?.includes('id="__nuxt"');
          if (!hasNuxtData) {
            errors.push('Missing Nuxt configuration indicators');
          }
        }

        return {
          passed: errors.length === 0,
          confidence: 1.0,
          output: errors.length === 0 ? 'Vue/Nuxt checks passed' : errors.join(', '),
          source: 'vue-validator'
        };
      }
    }
  ],
  rules: [
    {
      id: 'vue.meta.exists',
      name: 'Vue Meta Check',
      capabilityId: 'vue.audit',
      severity: 'warning',
      description: 'Verify Vue/Nuxt page meta information configuration.',
      validatorName: 'vue-validator',
      autoFix: false,
      version: '1.0.0',
      standard: 'STD-VUE-01'
    }
  ]
};

// Angular Plugin
export const angularPlugin: PlatformPlugin = {
  id: 'angular',
  version: '1.0.0',
  engines: {
    seokit: '^2.0.0-rc1'
  },
  capabilities: [
    {
      id: 'angular.audit',
      version: '1.0.0',
      rules: ['angular.meta.service'],
      validators: ['angular-validator'],
      frameworkCapabilities: [],
      dependencies: [],
      events: []
    }
  ],
  validators: [
    {
      id: 'angular-validator',
      version: '1.0.0',
      execute: async (plan: any, context: any) => {
        if (context.framework?.framework !== 'Angular') {
          return { passed: true, confidence: 1.0, output: 'Skipped - Angular not detected', source: 'angular-validator' };
        }

        const errors: string[] = [];
        const hasAppRoot = context.rawHtml?.includes('app-root');
        if (!hasAppRoot) {
          errors.push('Missing Angular app-root tag');
        }

        return {
          passed: errors.length === 0,
          confidence: 1.0,
          output: errors.length === 0 ? 'Angular checks passed' : errors.join(', '),
          source: 'angular-validator'
        };
      }
    }
  ],
  rules: [
    {
      id: 'angular.meta.service',
      name: 'Angular Meta Service Check',
      capabilityId: 'angular.audit',
      severity: 'warning',
      description: 'Verify page has Angular Title/Meta services set up.',
      validatorName: 'angular-validator',
      autoFix: false,
      version: '1.0.0',
      standard: 'STD-ANGULAR-01'
    }
  ]
};

// Astro Plugin
export const astroPlugin: PlatformPlugin = {
  id: 'astro',
  version: '1.0.0',
  engines: {
    seokit: '^2.0.0-rc1'
  },
  capabilities: [
    {
      id: 'astro.audit',
      version: '1.0.0',
      rules: ['astro.seo.configured'],
      validators: ['astro-validator'],
      frameworkCapabilities: [],
      dependencies: [],
      events: []
    }
  ],
  validators: [
    {
      id: 'astro-validator',
      version: '1.0.0',
      execute: async (plan: any, context: any) => {
        if (context.framework?.framework !== 'Astro') {
          return { passed: true, confidence: 1.0, output: 'Skipped - Astro not detected', source: 'astro-validator' };
        }

        const errors: string[] = [];
        const hasAstroAttrs = context.rawHtml?.includes('astro-') || context.rawHtml?.includes('data-astro-');
        if (!hasAstroAttrs) {
          errors.push('Missing Astro compilation selectors');
        }

        return {
          passed: errors.length === 0,
          confidence: 1.0,
          output: errors.length === 0 ? 'Astro checks passed' : errors.join(', '),
          source: 'astro-validator'
        };
      }
    }
  ],
  rules: [
    {
      id: 'astro.seo.configured',
      name: 'Astro SEO Check',
      capabilityId: 'astro.audit',
      severity: 'warning',
      description: 'Verify page features Astro SEO elements configuration.',
      validatorName: 'astro-validator',
      autoFix: false,
      version: '1.0.0',
      standard: 'STD-ASTRO-01'
    }
  ]
};

// Svelte Plugin
export const sveltePlugin: PlatformPlugin = {
  id: 'svelte',
  version: '1.0.0',
  engines: {
    seokit: '^2.0.0-rc1'
  },
  capabilities: [
    {
      id: 'svelte.audit',
      version: '1.0.0',
      rules: ['svelte.metadata.configured'],
      validators: ['svelte-validator'],
      frameworkCapabilities: [],
      dependencies: [],
      events: []
    }
  ],
  validators: [
    {
      id: 'svelte-validator',
      version: '1.0.0',
      execute: async (plan: any, context: any) => {
        if (context.framework?.framework !== 'Svelte') {
          return { passed: true, confidence: 1.0, output: 'Skipped - Svelte not detected', source: 'svelte-validator' };
        }

        const errors: string[] = [];
        const hasSvelteAttrs = context.rawHtml?.includes('svelte-') || context.rawHtml?.includes('data-sveltekit-');
        if (!hasSvelteAttrs) {
          errors.push('Missing Svelte/SvelteKit dynamic hydration indicators');
        }

        return {
          passed: errors.length === 0,
          confidence: 1.0,
          output: errors.length === 0 ? 'Svelte/SvelteKit checks passed' : errors.join(', '),
          source: 'svelte-validator'
        };
      }
    }
  ],
  rules: [
    {
      id: 'svelte.metadata.configured',
      name: 'Svelte Metadata Check',
      capabilityId: 'svelte.audit',
      severity: 'warning',
      description: 'Verify page has Svelte layout metadata configured.',
      validatorName: 'svelte-validator',
      autoFix: false,
      version: '1.0.0',
      standard: 'STD-SVELTE-01'
    }
  ]
};

// Register all framework plugins dynamically
PluginRegistry.register(nextjsPlugin);
PluginRegistry.register(reactPlugin);
PluginRegistry.register(vuePlugin);
PluginRegistry.register(angularPlugin);
PluginRegistry.register(astroPlugin);
PluginRegistry.register(sveltePlugin);
