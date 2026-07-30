import { describe, it, expect } from 'vitest';
import { structuredDataPlugin } from './index.js';

describe('SEOKit Structured Data Plugin Checks', () => {
  const mockPlan: any = {
    capabilityId: 'structured.data.audit',
    validators: ['structured-data-validator'],
    context: {}
  };

  it('should validate successfully when all JSON-LD blocks are correct', async () => {
    const validator = structuredDataPlugin.validators!.find((v: any) => v.id === 'structured-data-validator');
    expect(validator).toBeDefined();

    const context = {
      rawHtml: `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@type": "WebPage",
                "name": "Example Page"
              }
            </script>
          </head>
        </html>
      `
    };

    const result = await validator!.execute(mockPlan, context);
    expect(result.passed).toBe(true);
    expect(result.output).toBe('All JSON-LD structured data blocks are valid.');
  });

  it('should fail validation when JSON-LD is malformed', async () => {
    const validator = structuredDataPlugin.validators!.find((v: any) => v.id === 'structured-data-validator');
    expect(validator).toBeDefined();

    const context = {
      rawHtml: `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@type": "WebPage",
                "name": "Example Page",
              }
            </script>
          </head>
        </html>
      `
    };

    const result = await validator!.execute(mockPlan, context);
    expect(result.passed).toBe(false);
    expect(result.output).toContain('contains malformed JSON-LD');
  });
});
