import { PlatformPlugin, PluginRegistry } from '@seokit/core';
import { metadataValidator } from './validators/metadata.js';
import { canonicalValidator } from './validators/canonical.js';
import { sitemapValidator } from './validators/sitemap.js';
import { opengraphValidator } from './validators/opengraph.js';
import { twitterValidator } from './validators/twitter.js';
import { schemaValidator } from './validators/schema.js';
import { robotsValidator } from './validators/robots.js';

export const seoPlugin: PlatformPlugin = {
  id: 'seo',
  version: '1.0.0',
  capabilities: [
    {
      id: 'seo.metadata',
      version: '1.0.0',
      rules: ['seo.metadata.exists'],
      validators: ['metadata-validator'],
      frameworkCapabilities: ['metadata'],
      dependencies: [],
      events: ['MetadataVerified']
    },
    {
      id: 'seo.canonical',
      version: '1.0.0',
      rules: ['seo.canonical.exists'],
      validators: ['canonical-validator'],
      frameworkCapabilities: ['routing'],
      dependencies: ['seo.metadata'],
      events: ['CanonicalVerified']
    },
    {
      id: 'seo.opengraph',
      version: '1.0.0',
      rules: ['seo.opengraph.valid'],
      validators: ['opengraph-validator'],
      frameworkCapabilities: ['metadata'],
      dependencies: ['seo.metadata'],
      events: ['OpenGraphVerified']
    },
    {
      id: 'seo.twitter',
      version: '1.0.0',
      rules: ['seo.twitter.valid'],
      validators: ['twitter-validator'],
      frameworkCapabilities: ['metadata'],
      dependencies: ['seo.metadata'],
      events: ['TwitterVerified']
    },
    {
      id: 'seo.schema',
      version: '1.0.0',
      rules: ['seo.schema.valid'],
      validators: ['schema-validator'],
      frameworkCapabilities: ['metadata'],
      dependencies: ['seo.metadata'],
      events: ['SchemaVerified']
    },
    {
      id: 'seo.robots',
      version: '1.0.0',
      rules: ['seo.robots.valid'],
      validators: ['robots-validator'],
      frameworkCapabilities: ['robots'],
      dependencies: [],
      events: ['RobotsVerified']
    },
    {
      id: 'seo.sitemap',
      version: '1.0.0',
      rules: ['seo.sitemap.valid'],
      validators: ['sitemap-validator'],
      frameworkCapabilities: ['sitemap'],
      dependencies: ['seo.canonical'],
      events: ['SitemapVerified']
    }
  ],
  validators: [
    metadataValidator,
    canonicalValidator,
    sitemapValidator,
    opengraphValidator,
    twitterValidator,
    schemaValidator,
    robotsValidator
  ],
  rules: [
    {
      id: 'seo.metadata.exists',
      name: 'Metadata Exists',
      capabilityId: 'seo.metadata',
      severity: 'error',
      description: 'Page must have title and description.',
      validatorName: 'metadata-validator',
      autoFix: true,
      version: '1.0.0',
      standard: 'STD-04'
    },
    {
      id: 'seo.canonical.exists',
      name: 'Canonical Exists',
      capabilityId: 'seo.canonical',
      severity: 'error',
      description: 'Page must declare an absolute canonical URL.',
      validatorName: 'canonical-validator',
      autoFix: true,
      version: '1.0.0',
      standard: 'STD-04'
    },
    {
      id: 'seo.opengraph.valid',
      name: 'Valid Open Graph',
      capabilityId: 'seo.opengraph',
      severity: 'warning',
      description: 'Ensure open graph tags are present and valid.',
      validatorName: 'opengraph-validator',
      autoFix: true,
      version: '1.0.0',
      standard: 'STD-08'
    },
    {
      id: 'seo.twitter.valid',
      name: 'Valid Twitter Cards',
      capabilityId: 'seo.twitter',
      severity: 'warning',
      description: 'Ensure twitter card tags are present and valid.',
      validatorName: 'twitter-validator',
      autoFix: true,
      version: '1.0.0',
      standard: 'STD-08'
    },
    {
      id: 'seo.schema.valid',
      name: 'Valid Structured Data',
      capabilityId: 'seo.schema',
      severity: 'error',
      description: 'Page JSON-LD structures must parse correctly.',
      validatorName: 'schema-validator',
      autoFix: false,
      version: '1.0.0',
      standard: 'STD-08'
    },
    {
      id: 'seo.robots.valid',
      name: 'Valid robots.txt directives',
      capabilityId: 'seo.robots',
      severity: 'error',
      description: 'Robots.txt file must have User-agent rules.',
      validatorName: 'robots-validator',
      autoFix: false,
      version: '1.0.0',
      standard: 'STD-01'
    },
    {
      id: 'seo.sitemap.valid',
      name: 'Valid Sitemap',
      capabilityId: 'seo.sitemap',
      severity: 'error',
      description: 'Sitemap must be valid XML.',
      validatorName: 'sitemap-validator',
      autoFix: false,
      version: '1.0.0',
      standard: 'STD-05'
    }
  ]
};

PluginRegistry.register(seoPlugin);
