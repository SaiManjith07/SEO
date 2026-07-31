export type OpportunityType = 'UNLINKED_MENTION' | 'NARRATIVE_GAP' | 'BACKLINK_LOST';

export interface Opportunity {
  id: string;
  url: string;
  type: OpportunityType;
  domainRating: number;
  contactEmail?: string;
  contextSnippet?: string; // e.g. "We think XYZ is a good tool..."
  discoveredAt: string;
}

export type OutreachState = 
  | 'DISCOVERED'
  | 'SCORED'
  | 'DRAFTED'
  | 'CONTACTED'
  | 'ACQUIRED'
  | 'REJECTED';

export interface ScoredOpportunity extends Opportunity {
  score: number; // 0-100
  state: OutreachState;
  draftContent?: string;
}
