import { PlatformPlugin, PluginRegistry } from '@seokit/core';
import { geoOrgValidator } from './validators/org.js';
import { geoAuthorValidator } from './validators/author.js';
import { geoCitationValidator } from './validators/citation.js';
import { geoGeographicValidator } from './validators/geographic.js';
import { geoKnowledgeValidator } from './validators/knowledge.js';
import { geoProvenanceValidator } from './validators/provenance.js';
import { geoStatisticsValidator } from './validators/statistics.js';
import { geoQuotesValidator } from './validators/quotes.js';

export const geoPlugin: PlatformPlugin = {
  id: 'geo',
  version: '1.0.0',
  capabilities: [
    {
      id: 'geo.audit',
      version: '1.0.0',
      rules: [
        'geo.org.schema',
        'geo.author.attribution',
        'geo.citation.markup',
        'geo.geographic.address',
        'geo.knowledge.sameas',
        'geo.provenance.dates',
        'geo.statistics.density',
        'geo.quotes.authority'
      ],
      validators: [
        'geo-org-validator',
        'geo-author-validator',
        'geo-citation-validator',
        'geo-geographic-validator',
        'geo-knowledge-validator',
        'geo-provenance-validator',
        'geo-statistics-validator',
        'geo-quotes-validator'
      ],
      frameworkCapabilities: ['geo'],
      dependencies: [],
      events: ['GeoAudited']
    }
  ],
  validators: [
    geoOrgValidator,
    geoAuthorValidator,
    geoCitationValidator,
    geoGeographicValidator,
    geoKnowledgeValidator,
    geoProvenanceValidator,
    geoStatisticsValidator,
    geoQuotesValidator
  ],
  rules: [
    {
      id: 'geo.org.schema',
      name: 'Organization Schema Representation',
      capabilityId: 'geo.audit',
      severity: 'error',
      description: 'The page must define an Organization structured metadata block.',
      validatorName: 'geo-org-validator',
      autoFix: true,
      version: '1.0.0',
      standard: 'STD-09'
    },
    {
      id: 'geo.author.attribution',
      name: 'Author Attribution Metadata',
      capabilityId: 'geo.audit',
      severity: 'error',
      description: 'The page must assign an author creator attribute.',
      validatorName: 'geo-author-validator',
      autoFix: true,
      version: '1.0.0',
      standard: 'STD-09'
    },
    {
      id: 'geo.citation.markup',
      name: 'Authoritative Citations markup',
      capabilityId: 'geo.audit',
      severity: 'warning',
      description: 'Hyperlink outward reference sources to back page quality claims.',
      validatorName: 'geo-citation-validator',
      autoFix: true,
      version: '1.0.0',
      standard: 'STD-15'
    },
    {
      id: 'geo.geographic.address',
      name: 'Geographic location indicators',
      capabilityId: 'geo.audit',
      severity: 'warning',
      description: 'Declare local/geographic address schema fields.',
      validatorName: 'geo-geographic-validator',
      autoFix: true,
      version: '1.0.0',
      standard: 'STD-09'
    },
    {
      id: 'geo.knowledge.sameas',
      name: 'sameAs Knowledge Graph links',
      capabilityId: 'geo.audit',
      severity: 'warning',
      description: 'Correlate custom entities to official KG records.',
      validatorName: 'geo-knowledge-validator',
      autoFix: true,
      version: '1.0.0',
      standard: 'STD-09'
    },
    {
      id: 'geo.provenance.dates',
      name: 'Content provenance timestamp signals',
      capabilityId: 'geo.audit',
      severity: 'warning',
      description: 'Provide explicit publication and modification dates.',
      validatorName: 'geo-provenance-validator',
      autoFix: true,
      version: '1.0.0',
      standard: 'STD-15'
    },
    {
      id: 'geo.statistics.density',
      name: 'Verify Numeric Statistics Density',
      capabilityId: 'geo.audit',
      severity: 'warning',
      description: 'Include statistics or percentages to back qualitative assertions.',
      validatorName: 'geo-statistics-validator',
      autoFix: true,
      version: '1.0.0',
      standard: 'STD-15'
    },
    {
      id: 'geo.quotes.authority',
      name: 'Verify Authoritative Quotes Presence',
      capabilityId: 'geo.audit',
      severity: 'warning',
      description: 'Include quotations from named source figures to back assertions.',
      validatorName: 'geo-quotes-validator',
      autoFix: true,
      version: '1.0.0',
      standard: 'STD-15'
    }
  ]
};

PluginRegistry.register(geoPlugin);
