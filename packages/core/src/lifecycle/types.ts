export type ContentType = 'documentation' | 'news' | 'tutorials' | 'product' | 'blog' | 'faq' | 'legal' | 'commercial' | 'evergreen' | 'unknown';

export interface PageMetadata {
  url: string;
  keyword: string;
  lastUpdated: string;
  contentType: ContentType;
}

export type LifecycleState = 
  | 'DETECTED' 
  | 'QUEUED' 
  | 'DRAFTING' 
  | 'REVIEW' 
  | 'APPROVED' 
  | 'PUBLISHED' 
  | 'MEASURING' 
  | 'EVALUATED';

export interface DecayScore {
  score: number; // 0-100
  factors: {
    ageFactor: number;
    momentumFactor: number;
    impressionFactor: number;
    volatilityFactor: number;
  };
  isDecaying: boolean;
  reason: string;
}

export interface RefreshResult {
  url: string;
  originalContent: string;
  draftContent: string;
  status: 'SUCCESS' | 'FAILED';
  error?: string;
}

export interface EffectivenessResult {
  url: string;
  classification: 'SUCCESS' | 'NEUTRAL' | 'FAILED';
  positionDelta: number;
  ctrDelta: number;
}
