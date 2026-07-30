# SEOKit v2 Platform: Third-Party Plugin Development Guide

SEOKit v2 is a universal website verification platform designed to be completely extensible. External developers can build and distribute custom capability plugins.

---

## 1. Get Started

Install the SEOKit SDK in your custom plugin project:
```bash
npm install @seokit/sdk
```

---

## 2. Define the Plugin Manifest

Implement the `PlatformPlugin` interface. A plugin registers its metadata, capabilities, validators, rules, and optional setup/cleanup lifecycle hooks:

```typescript
import { PlatformPlugin, PluginRegistry } from '@seokit/sdk';

export const customPlugin: PlatformPlugin = {
  id: 'custom-visibility',
  version: '1.0.0',
  engines: {
    seokit: '^2.0.0'
  },
  capabilities: [
    {
      id: 'custom.audit',
      version: '1.0.0',
      description: 'Audit custom branding and keyword structures.'
    }
  ],
  validators: [
    {
      id: 'branding-validator',
      name: 'Custom Branding Validator',
      validate: async (context) => {
        const hasKeyword = context.rawHtml.includes('MyBrand');
        return {
          passed: hasKeyword,
          output: hasKeyword ? 'Branding keyword matches.' : 'Offending page lacks Branding keyword "MyBrand".',
          severity: 'warning'
        };
      }
    }
  ],
  rules: [
    {
      id: 'custom.branding.exists',
      name: 'Branding Check',
      capabilityId: 'custom.audit',
      severity: 'warning',
      description: 'Page must feature MyBrand references.',
      validatorName: 'branding-validator',
      autoFix: false,
      version: '1.0.0',
      standard: 'STD-CUSTOM'
    }
  ]
};

// Self-register dynamically on import
PluginRegistry.register(customPlugin);
```

---

## 3. Dynamically Load Custom Plugins

Any client can load your plugin by declaring its package name or local path in the session configurations:

### CLI Usage:
```bash
seokit-v2 verify --plugins my-custom-plugin-package-name
```

### MCP / Programmatic API Usage:
```typescript
const session = await orchestrator.createSession({
  workspaceRoot: '/my-project',
  plugins: ['seo', 'my-custom-plugin-package-name'],
  options: {}
});
```

During session initialization, `VerificationOrchestrator` will use ES dynamic imports to load and auto-register your plugin.
