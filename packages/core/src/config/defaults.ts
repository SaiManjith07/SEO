export interface IntelligenceSettings {
  thinContentThreshold: number;
  duplicateSimilarity: number;
  cannibalizationSimilarity: number;
  orphanExclusions: string[];
  requiredEeatPages: string[];
}

export interface HtmlSettings {
  maxTitleLength: number;
  minMetaDescriptionLength: number;
  maxMetaDescriptionLength: number;
}

export interface SandboxSettings {
  cpuTimeoutMs: number;
}

export interface AeoSettings {
  questionHeadingsRatio: number;
  statisticsDensityMinWordCount: number;
  statisticsDensityRatio: number;
  outboundCitationsMinWordCount: number;
  outboundCitationsMinCount: number;
  pronounDensityMinWordCount: number;
  pronounDensityMaxRatio: number;
  longParagraphsMaxParagraphCount: number;
  longParagraphsMaxWordCount: number;
  longParagraphsRatio: number;
  answerFirstOpeningMinWordCount: number;
  answerFirstOpeningWordsRange: number;
  minScorableWords: number;
  chunkSuitabilityMinWords: number;
  chunkSuitabilityMaxWords: number;
  chunkSuitabilityPronounDensity: number;
  entityDensityHighRatio: number;
  entityDensityMedRatio: number;
}

export interface SchemaSettings {
  minSameAsCount: number;
  parityProbeSliceLength: number;
  parityMinProbeLength: number;
}

export interface AiAccessSettings {
  minServerTextRatio: number;
  minServerWordCount: number;
}

export interface TrackingSettings {
  retentionDays: number;
  comparisonWindowDays: number;
  alertPositionDropThreshold: number;
  alertPositionImproveThreshold: number;
  alertCtrDropThreshold: number;
}

export interface LifecycleSettings {
  highImpressionThreshold: number;
  positionRange: [number, number];
  cadenceMonths: Record<string, number>;
  exclusions: string[];
}

export interface OutreachSettings {
  minDomainRating: number;
  brandName: string;
  targetCompetitors: string[];
  outreachPersona: string;
}

export interface SeoKitSettings {
  intelligence: IntelligenceSettings;
  html: HtmlSettings;
  sandbox: SandboxSettings;
  aeo: AeoSettings;
  schema: SchemaSettings;
  aiAccess: AiAccessSettings;
  tracking: TrackingSettings;
  lifecycle: LifecycleSettings;
  outreach: OutreachSettings;
}

export const DEFAULT_SETTINGS: SeoKitSettings = {
  intelligence: {
    thinContentThreshold: 200,
    duplicateSimilarity: 0.85,
    cannibalizationSimilarity: 0.85,
    orphanExclusions: [],
    requiredEeatPages: ['about', 'contact', 'privacy', 'terms']
  },
  html: {
    maxTitleLength: 60,
    minMetaDescriptionLength: 120,
    maxMetaDescriptionLength: 160
  },
  sandbox: {
    cpuTimeoutMs: 3000
  },
  aeo: {
    questionHeadingsRatio: 0.3,
    statisticsDensityMinWordCount: 200,
    statisticsDensityRatio: 0.5,
    outboundCitationsMinWordCount: 300,
    outboundCitationsMinCount: 3,
    pronounDensityMinWordCount: 200,
    pronounDensityMaxRatio: 6.0,
    longParagraphsMaxParagraphCount: 3,
    longParagraphsMaxWordCount: 90,
    longParagraphsRatio: 0.3,
    answerFirstOpeningMinWordCount: 200,
    answerFirstOpeningWordsRange: 60,
    minScorableWords: 200,
    chunkSuitabilityMinWords: 50,
    chunkSuitabilityMaxWords: 250,
    chunkSuitabilityPronounDensity: 4.0,
    entityDensityHighRatio: 1.5,
    entityDensityMedRatio: 0.8
  },
  schema: {
    minSameAsCount: 2,
    parityProbeSliceLength: 40,
    parityMinProbeLength: 15
  },
  aiAccess: {
    minServerTextRatio: 0.5,
    minServerWordCount: 50
  },
  tracking: {
    retentionDays: 365,
    comparisonWindowDays: 7,
    alertPositionDropThreshold: 3,
    alertPositionImproveThreshold: 3,
    alertCtrDropThreshold: 0.05
  },
  lifecycle: {
    highImpressionThreshold: 1000,
    positionRange: [4, 15],
    cadenceMonths: {
      documentation: 6,
      news: 1,
      tutorials: 6,
      product: 3,
      blog: 12,
      faq: 6,
      legal: 12,
      commercial: 3,
      evergreen: 12
    },
    exclusions: ['/archive/', '/seasonal/', '/noindex/']
  },
  outreach: {
    minDomainRating: 30,
    brandName: 'SEOKit',
    targetCompetitors: ['CompetitorA', 'CompetitorB'],
    outreachPersona: 'Professional yet conversational, focusing on mutual value.'
  }
};
