import { describe, it, expect } from 'vitest';
import { CertificationSuite } from '@seokit/core';
import { aeoPlugin } from './index.js';

describe('AEO Plugin Certification & Verification', () => {
  it('should pass platform certification', () => {
    const suite = new CertificationSuite();
    const result = suite.certifyPlugin(aeoPlugin);
    
    expect(result.errors).toEqual([]);
    expect(result.passed).toBe(true);
  });

  it('should run content structure, FAQ schema, and entity density validations', async () => {
    const validators = aeoPlugin.validators || [];
    const structVal = validators.find(v => v.id === 'aeo-structure-validator');
    const headingsVal = validators.find(v => v.id === 'aeo-headings-validator');
    const faqVal = validators.find(v => v.id === 'aeo-faq-validator');
    const entityVal = validators.find(v => v.id === 'aeo-entity-validator');
    const chunkingVal = validators.find(v => v.id === 'aeo-chunking-validator');
    const extractVal = validators.find(v => v.id === 'aeo-extractability-validator');

    expect(structVal).toBeDefined();
    expect(headingsVal).toBeDefined();
    expect(faqVal).toBeDefined();
    expect(entityVal).toBeDefined();
    expect(chunkingVal).toBeDefined();
    expect(extractVal).toBeDefined();

    const dummyPlan: any = { capabilityId: 'aeo.audit', validators: [], context: {} };

    // 1. Structure check - no issues
    const passHtml = '<html><body><p>Concise paragraph text with few words.</p></body></html>';
    const structRes = await structVal!.execute(dummyPlan, { rawHtml: passHtml });
    expect(structRes.passed).toBe(true);

    // 2. Headings check - failing questions-align
    const noQuestionsHtml = '<html><body><h2>No Questions Here</h2><p>Content block.</p></body></html>';
    const headingsRes = await headingsVal!.execute(dummyPlan, { rawHtml: noQuestionsHtml });
    expect(headingsRes.passed).toBe(false);
    expect(headingsRes.fixPlan?.ruleId).toBe('aeo.headings.questions');

    // 3. FAQ check - failing
    const faqRes = await faqVal!.execute(dummyPlan, { rawHtml: passHtml });
    expect(faqRes.passed).toBe(false);
    expect(faqRes.fixPlan?.ruleId).toBe('aeo.faq.schema');

    // 4. Entity Density check - passes when proper nouns are used
    const entityHtml = '<html><body><p>Google and Gemini use SSR for AEO and SEO. Next.js helps.</p></body></html>';
    const entityRes = await entityVal!.execute(dummyPlan, { rawHtml: entityHtml });
    expect(entityRes.passed).toBe(true);

    // 5. Chunking - suitability using rich optimized content
    const chunkHtml = `
      <html>
      <body>
        <h2>What is Answer Engine Optimization?</h2>
        <p>Answer Engine Optimization or AEO is a modern framework designed to format information on web pages specifically for retrieval by generative search engines. Traditional search engine optimization focuses on keyword matching and domain authority rank, whereas Answer Engine Optimization prioritizes clear structural text segments that answer specific user questions directly. By structuring your content with direct question-shaped subheadings and concise, self-contained paragraphs (the BLUFF method), you ensure that AI crawlers can locate and extract matching answers cleanly. Integrating structured schemas like FAQPage and maintaining proper entity references further improves candidate extraction accuracy, allowing your platform to maximize authoritative citation visibility across all AI search interfaces.</p>
      </body>
      </html>
    `;
    const chunkRes = await chunkingVal!.execute(dummyPlan, { rawHtml: chunkHtml });
    expect(chunkRes.passed).toBe(true);

    // 6. Extractability - insufficient wordcount
    const extractRes = await extractVal!.execute(dummyPlan, { rawHtml: passHtml });
    expect(extractRes.passed).toBe(false);
    expect(extractRes.fixPlan?.ruleId).toBe('aeo.extractability.wordcount');
  });
});
