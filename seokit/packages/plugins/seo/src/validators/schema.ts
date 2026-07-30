import { ExecutionPlan, VerificationEvidence, ValidatorPlugin } from '@seokit/core';
import * as cheerio from 'cheerio';

export const schemaValidator: ValidatorPlugin = {
  id: 'schema-validator',
  version: '1.0.0',
  async execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence> {
    const html = context.rawHtml || context.pageHtml || '';
    if (!html) {
      return {
        passed: false,
        confidence: 1.0,
        output: 'No HTML content available for schema verification',
        source: 'schema-validator'
      };
    }

    const $ = cheerio.load(html);
    const scripts = $('script[type="application/ld+json"]');
    if (scripts.length === 0) {
      return {
        passed: false,
        confidence: 1.0,
        output: 'No JSON-LD structured data blocks found on the page.',
        source: 'schema-validator'
      };
    }

    const parseErrors: string[] = [];
    const entityTypesSeen = new Set<string>();
    const duplicateTypes: string[] = [];

    scripts.each((i: number, el: any) => {
      const content = $(el).html() ?? '';
      try {
        const data = JSON.parse(content.trim());
        
        // 1. Context validation
        const ctx = data['@context'];
        if (!ctx || (typeof ctx === 'string' && !ctx.includes('schema.org'))) {
          parseErrors.push(`Block ${i + 1}: Missing or invalid @context. Must reference schema.org.`);
        }

        // 2. Type validation
        const type = data['@type'];
        if (!type) {
          parseErrors.push(`Block ${i + 1}: Missing @type entity descriptor.`);
        } else {
          // Track duplicates
          if (entityTypesSeen.has(type)) {
            duplicateTypes.push(type);
          } else {
            entityTypesSeen.add(type);
          }

          // 3. Required fields validation depending on type
          if (type === 'WebPage' || type === 'Article' || type === 'Organization') {
            if (!data.name && !data.headline) {
              parseErrors.push(`Block ${i + 1} (${type}): Missing required 'name' or 'headline' fields.`);
            }
          }
        }
      } catch (err: any) {
        parseErrors.push(`Block ${i + 1}: JSON parsing failed: ${err.message}`);
      }
    });

    const issues: string[] = [...parseErrors];
    if (duplicateTypes.length > 0) {
      issues.push(`Duplicate schemas detected for types: ${duplicateTypes.join(', ')}`);
    }

    return {
      passed: issues.length === 0,
      confidence: 1.0,
      output: issues.length === 0 
        ? `Successfully validated ${scripts.length} JSON-LD blocks.`
        : `JSON-LD validation failed: ${issues.join('; ')}`,
      source: 'schema-validator'
    };
  }
};
