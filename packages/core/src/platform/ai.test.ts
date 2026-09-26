import { describe, it, expect } from 'vitest';
import { AIIntelligenceEngine } from './ai.js';

describe('SEOKit v3 AI Intelligence & Platform Tests', () => {
  it('should generate recommendations based on failed rule verification metrics', () => {
    const mockEvidences = [
      { ruleId: 'seo.canonical.exists', passed: false },
      { ruleId: 'performance.images.alt', passed: false },
      { ruleId: 'seo.title.exists', passed: true }
    ];

    const recs = AIIntelligenceEngine.generateRecommendations(mockEvidences);
    expect(recs.length).toBe(2);
    expect(recs[0].impact).toBe('high');
    expect(recs[0].ruleId).toBe('seo.canonical.exists');
    expect(recs[1].impact).toBe('medium');
  });

  it('should cluster keywords based on word topics', () => {
    const keywords = [
      { term: 'seo software tools', volume: 8100 },
      { term: 'seo visibility audit', volume: 1600 },
      { term: 'aeo optimize strategies', volume: 880 }
    ];

    const clusters = AIIntelligenceEngine.clusterKeywords(keywords);
    expect(clusters.length).toBe(2); // 'seo' and 'aeo'
    const seoCluster = clusters.find(c => c.topic === 'seo');
    expect(seoCluster).toBeDefined();
    expect(seoCluster?.keywords.length).toBe(2);
    expect(seoCluster?.monthlyVolume).toBe(9700);
  });

  it('should produce SEO-optimized draft articles with target keywords', () => {
    const topic = 'AI Search Optimization';
    const keywords = ['AI search ranks', 'llm optimize'];
    const draft = AIIntelligenceEngine.generateContentDraft(topic, keywords);

    expect(draft).toContain('# Draft: AI Search Optimization');
    expect(draft).toContain('AI search ranks');
    expect(draft).toContain('llm optimize');
  });
});
