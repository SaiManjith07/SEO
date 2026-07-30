import { describe, it, expect } from 'vitest';
import { extractChunks, scoreChunk, calculateEntityDensity } from './aeo.js';

const HTML_SAMPLE = `
<body>
  <h1>Optimize Performance</h1>
  <p>In this article we will explain how to optimize speed. It is extremely fast and simple.</p>
  
  <h2>How much does Next.js optimization cost?</h2>
  <p>Next.js optimization costs 20 to 50 hours of work. Bundle sizes represent 40% of page speed issues.</p>
  
  <h2>Why does INP fail?</h2>
  <p>Interaction to Next Paint delays trace to main thread blocking. Google prefers fast interfaces.</p>
</body>
`;

describe('AEO Depth: Chunking and Entity Density tests', () => {
  it('should extract heading-based chunks correctly', () => {
    const chunks = extractChunks(HTML_SAMPLE);
    
    // We expect 3 chunks: one for H1, two for H2s
    expect(chunks.length).toBe(3);
    expect(chunks[0].heading).toBe('Optimize Performance');
    expect(chunks[1].heading).toBe('How much does Next.js optimization cost?');
    expect(chunks[2].heading).toBe('Why does INP fail?');
    
    expect(chunks[1].content).toContain('Next.js optimization costs');
  });

  it('should score individual chunks on suitability', () => {
    const chunks = extractChunks(HTML_SAMPLE);
    
    const introScore = scoreChunk(chunks[0]);
    // Intro has "In this article we will" which is a hedge -> lower bluffScore
    expect(introScore.bluffScore).toBe(40);
    
    const nextJsScore = scoreChunk(chunks[1]);
    // This chunk starts with direct question, contains numbers -> high suitability
    expect(nextJsScore.questionHead).toBe(true);
    expect(nextJsScore.evidenceCount).toBeGreaterThan(0);
    expect(nextJsScore.suitabilityScore).toBeGreaterThan(50);
  });

  it('should calculate entity-to-pronoun density correctly', () => {
    const text = 'Next.js is a great framework. It optimizes LCP and INP performance on Google.';
    const result = calculateEntityDensity(text);
    
    expect(result.nouns).toContain('Nextjs'); // cleaned punctuation
    expect(result.nouns).toContain('Google');
    expect(result.nouns).toContain('LCP');
    expect(result.pronouns).toContain('It');
    expect(result.ratio).toBeGreaterThan(0.5);
  });
});
