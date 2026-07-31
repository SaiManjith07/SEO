import { Opportunity } from './types';
import { ConfigurationProvider } from '../config/provider';

export class OpportunityScorer {
  private configProvider: ConfigurationProvider;

  constructor(configProvider: ConfigurationProvider) {
    this.configProvider = configProvider;
  }

  public score(opportunity: Opportunity): number {
    const config = this.configProvider.getSettings().outreach;
    
    if (opportunity.domainRating < config.minDomainRating) {
      return 0; // Filter out low DR sites
    }

    let score = 0;

    // Base score by type (Unlinked Mention is highest due to STD-26)
    switch (opportunity.type) {
      case 'UNLINKED_MENTION':
        score += 60;
        break;
      case 'NARRATIVE_GAP':
        score += 40;
        break;
      case 'BACKLINK_LOST':
        score += 30;
        break;
    }

    // DR bonus (up to 40 points)
    // Formula: (DR / 100) * 40
    const drBonus = (opportunity.domainRating / 100) * 40;
    score += drBonus;

    return Math.min(100, Math.round(score));
  }
}
