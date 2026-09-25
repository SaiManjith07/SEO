import { PlatformPlugin, PluginRegistry, ExecutionPlan, VerificationEvidence } from '@seokit/core';
import * as cheerio from 'cheerio';
// @ts-ignore
import * as sdk from 'structured-data-kit';

export const structuredDataPlugin: PlatformPlugin = {
  id: 'structured-data',
  version: '1.0.0',
  capabilities: [
    {
      id: 'structured.data.audit',
      version: '1.0.0',
      rules: ['structured.data.schema.valid'],
      validators: ['structured-data-validator'],
      frameworkCapabilities: [],
      dependencies: [],
      events: ['StructuredDataVerified']
    }
  ],
  validators: [
    {
      id: 'structured-data-validator',
      version: '1.0.0',
      async execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence> {
        const html = context.rawHtml || context.pageHtml || '';
        if (!html) {
          return {
            passed: false,
            confidence: 1.0,
            output: 'No HTML content available for structured data verification.',
            source: 'structured-data-validator'
          };
        }

        const $ = cheerio.load(html);
        const scripts = $('script[type="application/ld+json"]');
        if (scripts.length === 0) {
          return {
            passed: false,
            confidence: 1.0,
            output: 'No JSON-LD structured data blocks found on the page.',
            source: 'structured-data-validator'
          };
        }

        const validator = (sdk as any).Validator ? new (sdk as any).Validator() : sdk;
        const errors: string[] = [];
        
        scripts.each((i: number, el: any) => {
          const content = $(el).html() ?? '';
          try {
            const data = JSON.parse(content.trim());
            const result = validator.validate(data);
            if (!result.valid) {
              errors.push(`Block ${i + 1} validation failed: ${result.errors?.map((e: any) => e.message).join(', ') || 'Invalid Schema'}`);
            }
          } catch (err: any) {
            errors.push(`Block ${i + 1} contains malformed JSON-LD: ${err.message}`);
          }
        });

        return {
          passed: errors.length === 0,
          confidence: 1.0,
          output: errors.length === 0 ? 'All JSON-LD structured data blocks are valid according to structured-data-kit.' : errors.join(' | '),
          source: 'structured-data-validator'
        };
      }
    }
  ],
  rules: [
    {
      id: 'structured.data.schema.valid',
      name: 'Valid Structured JSON-LD',
      capabilityId: 'structured.data.audit',
      severity: 'error',
      description: 'Ensure JSON-LD script blocks parse correctly and reference valid schemas.',
      validatorName: 'structured-data-validator',
      autoFix: false,
      version: '1.0.0'
    }
  ]
};

PluginRegistry.register(structuredDataPlugin);
