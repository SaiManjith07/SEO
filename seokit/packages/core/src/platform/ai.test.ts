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

  it('should find content gaps against competitor keywords', () => {
    const ourKeywords = ['seo software tools', 'seo audit'];
    const competitorKeywords = ['seo software tools', 'competitor content gaps', 'backlink strategies'];

    const gaps = AIIntelligenceEngine.analyzeCompetitorGaps(ourKeywords, competitorKeywords);
    expect(gaps.length).toBe(2);
    expect(gaps[0].keyword).toBe('competitor content gaps');
    expect(gaps[0].ourRank).toBeNull();
  });

  it('should identify high-value backlink opportunities and toxic links', () => {
    const backlinks = [
      { url: 'https://highauthorityblog.com/resource', domainAuthority: 72 },
      { url: 'https://spammycheapnetwork.biz/link', domainAuthority: 6 }
    ];

    const audit = AIIntelligenceEngine.auditBacklinks(backlinks);
    expect(audit.opportunities.length).toBe(1);
    expect(audit.opportunities[0].domain).toBe('highauthorityblog.com');
    expect(audit.opportunities[0].opportunityType).toBe('resource-page');

    expect(audit.toxic.length).toBe(1);
    expect(audit.toxic[0].url).toBe('https://spammycheapnetwork.biz/link');
    expect(audit.toxic[0].toxicScore).toBe(85);
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
