export interface AIRecommendation {
  ruleId: string;
  issue: string;
  impact: 'high' | 'medium' | 'low';
  suggestion: string;
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
  gaps: ContentGap[];
  backlinkOpportunities: BacklinkOpportunity[];
  toxicLinks: ToxicBacklink[];
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

  public static analyzeCompetitorGaps(ourKeywords: string[], competitorKeywords: string[]): ContentGap[] {
    const gaps: ContentGap[] = [];
    const ourSet = new Set(ourKeywords.map(k => k.toLowerCase()));

    for (const ck of competitorKeywords) {
      if (!ourSet.has(ck.toLowerCase())) {
        gaps.push({
          keyword: ck,
          competitorRank: 3,
          ourRank: null,
          volume: 2400,
          recommendation: `Create a dedicated target landing page optimized for "${ck}".`
        });
      }
    }

    return gaps;
  }

  public static auditBacklinks(links: { url: string; domainAuthority: number }[]): {
    opportunities: BacklinkOpportunity[];
    toxic: ToxicBacklink[];
  } {
    const opportunities: BacklinkOpportunity[] = [];
    const toxic: ToxicBacklink[] = [];

    for (const link of links) {
      const hostname = new URL(link.url).hostname;
      if (link.domainAuthority > 50) {
        opportunities.push({
          domain: hostname,
          domainAuthority: link.domainAuthority,
          anchorText: 'Read More',
          opportunityType: 'resource-page'
        });
      } else if (link.domainAuthority < 10) {
        toxic.push({
          url: link.url,
          toxicScore: 85,
          reason: 'Low domain authority referring site indicating potentially spammy indexing networks.'
        });
      }
    }

    return { opportunities, toxic };
  }
}
