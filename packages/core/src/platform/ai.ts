export interface AIRecommendation {
  ruleId: string;
  issue: string;
  impact: 'high' | 'medium' | 'low';
  suggestion: string;
}

export interface AIProvider {
  generate(prompt: string): Promise<string>;
}

export interface KeywordCluster {
  topic: string;
  keywords: string[];
  monthlyVolume: number;
}

export interface ContentGap {
  keyword: string;
  competitorRank: number;
  ourRank: number | null;
  volume: number;
  recommendation: string;
}

export interface BacklinkOpportunity {
  domain: string;
  domainAuthority: number;
  anchorText: string;
  opportunityType: 'resource-page' | 'broken-link' | 'guest-post';
}

export interface ToxicBacklink {
  url: string;
  toxicScore: number; // 0-100
  reason: string;
}

export interface AIIntelligenceReport {
  recommendations: AIRecommendation[];
  clusters: KeywordCluster[];
}

export class AIIntelligenceEngine {
  public static generateRecommendations(evidences: any[]): AIRecommendation[] {
    const recs: AIRecommendation[] = [];
    for (const ev of evidences) {
      if (!ev.passed && ev.ruleId) {
        if (ev.ruleId === 'seo.canonical.exists') {
          recs.push({
            ruleId: ev.ruleId,
            issue: 'Canonical link tag is missing.',
            impact: 'high',
            suggestion: 'Add a <link rel="canonical" href="..."> tag to the head to avoid duplicate index issues.'
          });
        } else if (ev.ruleId === 'performance.images.alt') {
          recs.push({
            ruleId: ev.ruleId,
            issue: 'Images are missing alternative description attributes.',
            impact: 'medium',
            suggestion: 'Incorporate alt="..." descriptive alt tags on all img elements to improve image search ranks.'
          });
        }
      }
    }
    return recs;
  }

  public static generateContentDraft(topic: string, keywords: string[]): string {
    return `# Draft: ${topic}

This SEO-optimized article covers ${topic} by integrating high-value search phrases: ${keywords.join(', ')}.

## Introduction
Start by introducing ${topic} clearly to hook organic visitors.

## Key Strategies
*   Incorporate the target phrase "${keywords[0]}" in early body paragraphs.
*   Ensure structural headers mention "${keywords[1] || topic}".
`;
  }

  public static clusterKeywords(keywords: { term: string; volume: number }[]): KeywordCluster[] {
    const clusters: KeywordCluster[] = [];
    const topicsMap: Record<string, { keywords: string[]; volume: number }> = {};

    for (const kw of keywords) {
      // Basic grouping: extract the first word as the topic cluster
      const firstWord = kw.term.split(' ')[0] || 'general';
      if (!topicsMap[firstWord]) {
        topicsMap[firstWord] = { keywords: [], volume: 0 };
      }
      topicsMap[firstWord].keywords.push(kw.term);
      topicsMap[firstWord].volume += kw.volume;
    }

    for (const [topic, val] of Object.entries(topicsMap)) {
      clusters.push({
        topic,
        keywords: val.keywords,
        monthlyVolume: val.volume
      });
    }

    return clusters;
  }
}

