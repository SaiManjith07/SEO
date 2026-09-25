import { Opportunity, ScoredOpportunity, OutreachState } from './types.js';
import { OpportunityScorer } from './scorer.js';
import { OutreachGenerator } from './generator.js';
import { VerificationEventBus } from '../events.js';

export class OutreachEngine {
  private scorer: OpportunityScorer;
  private generator: OutreachGenerator;
  private eventBus: VerificationEventBus;
  
  private pipeline: Map<string, ScoredOpportunity> = new Map();

  constructor(scorer: OpportunityScorer, generator: OutreachGenerator, eventBus: VerificationEventBus) {
    this.scorer = scorer;
    this.generator = generator;
    this.eventBus = eventBus;
  }

  public discover(opportunity: Opportunity): ScoredOpportunity {
    const score = this.scorer.score(opportunity);
    const state: OutreachState = score > 0 ? 'SCORED' : 'REJECTED';
    
    const scoredOpp: ScoredOpportunity = {
      ...opportunity,
      score,
      state
    };

    this.pipeline.set(scoredOpp.id, scoredOpp);

    if (score > 0) {
      this.eventBus.publish('OpportunityDiscovered', {
        url: scoredOpp.url,
        type: scoredOpp.type,
        score
      });
    }

    return scoredOpp;
  }

  public async generateDraft(id: string): Promise<ScoredOpportunity> {
    const opp = this.pipeline.get(id);
    if (!opp) throw new Error(`Opportunity ${id} not found`);
    if (opp.state === 'REJECTED') throw new Error(`Cannot draft rejected opportunity`);

    const draftContent = await this.generator.generateDraft(opp);
    
    opp.draftContent = draftContent;
    opp.state = 'DRAFTED';
    this.pipeline.set(id, opp);

    this.eventBus.publish('OutreachDraftGenerated', {
      url: opp.url,
      draftContent
    });

    return opp;
  }

  public updateState(id: string, state: OutreachState): ScoredOpportunity {
    const opp = this.pipeline.get(id);
    if (!opp) throw new Error(`Opportunity ${id} not found`);
    
    opp.state = state;
    this.pipeline.set(id, opp);

    if (state === 'ACQUIRED' || state === 'REJECTED') {
      this.eventBus.publish('LinkStatusChanged', {
        url: opp.url,
        status: state
      });
    }

    return opp;
  }

  public getPipeline(): ScoredOpportunity[] {
    return Array.from(this.pipeline.values());
  }
}
