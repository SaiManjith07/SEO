import { PlatformPlugin, PluginRegistry } from '@seokit/core';
import { aeoStructureValidator } from './validators/structure.js';
import { aeoHeadingsValidator } from './validators/headings.js';
import { aeoFaqValidator } from './validators/faq.js';
import { aeoEntityValidator } from './validators/entity.js';
import { aeoChunkingValidator } from './validators/chunking.js';
import { aeoExtractabilityValidator } from './validators/extractability.js';

export const aeoPlugin: PlatformPlugin = {
  id: 'aeo',
  version: '1.0.0',
  capabilities: [
    {
      id: 'aeo.audit',
      version: '1.0.0',
      rules: [
        'aeo.content.structure',
        'aeo.headings.questions',
        'aeo.faq.schema',
        'aeo.entity.density',
        'aeo.chunking.suitability',
        'aeo.extractability.wordcount'
      ],
      validators: [
        'aeo-structure-validator',
        'aeo-headings-validator',
        'aeo-faq-validator',
        'aeo-entity-validator',
        'aeo-chunking-validator',
        'aeo-extractability-validator'
      ],
      frameworkCapabilities: ['aeo'],
      dependencies: [],
      events: ['AeoAudited']
    }
  ],
  validators: [
    aeoStructureValidator,
    aeoHeadingsValidator,
    aeoFaqValidator,
    aeoEntityValidator,
    aeoChunkingValidator,
    aeoExtractabilityValidator
  ],
  rules: [
    {
      id: 'aeo.content.structure',
      name: 'AEO Content Structure',
      capabilityId: 'aeo.audit',
      severity: 'warning',
      description: 'Paragraphs must be structured cleanly for retrieval.',
      validatorName: 'aeo-structure-validator',
      autoFix: true,
      version: '1.0.0',
      standard: 'STD-20'
    },
    {
      id: 'aeo.headings.questions',
      name: 'AEO Headings Questions Align',
      capabilityId: 'aeo.audit',
      severity: 'warning',
      description: 'Rephrase headers to match PAA structures.',
      validatorName: 'aeo-headings-validator',
      autoFix: true,
      version: '1.0.0',
      standard: 'STD-21'
    },
    {
      id: 'aeo.faq.schema',
      name: 'FAQ Schema Markup',
      capabilityId: 'aeo.audit',
      severity: 'warning',
      description: 'Ensure FAQPage schema is present for question-aligned content.',
      validatorName: 'aeo-faq-validator',
      autoFix: true,
      version: '1.0.0',
      standard: 'STD-22'
    },
    {
      id: 'aeo.entity.density',
      name: 'AEO Entity Density Check',
      capabilityId: 'aeo.audit',
      severity: 'warning',
      description: 'Nouns must outnumber vague pronouns.',
      validatorName: 'aeo-entity-validator',
      autoFix: true,
      version: '1.0.0',
      standard: 'STD-22'
    },
    {
      id: 'aeo.chunking.suitability',
      name: 'AEO Chunk Suitability',
      capabilityId: 'aeo.audit',
      severity: 'warning',
      description: 'Ensure heading blocks are optimized for direct answers.',
      validatorName: 'aeo-chunking-validator',
      autoFix: true,
      version: '1.0.0',
      standard: 'STD-22'
    },
    {
      id: 'aeo.extractability.wordcount',
      name: 'AEO Extractability Word Count',
      capabilityId: 'aeo.audit',
      severity: 'error',
      description: 'Verify page has sufficient word count for answer engine extraction.',
      validatorName: 'aeo-extractability-validator',
      autoFix: false,
      version: '1.0.0',
      standard: 'STD-22'
    }
  ]
};

PluginRegistry.register(aeoPlugin);
