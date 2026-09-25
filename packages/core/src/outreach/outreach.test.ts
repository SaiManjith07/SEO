import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpportunityScorer } from './scorer.js';
import { OutreachGenerator } from './generator.js';
import { OutreachEngine } from './engine.js';
import { ConfigurationProvider } from '../config/provider.js';
import { VerificationEventBus } from '../events.js';
import { Opportunity } from './types.js';
import { AIProvider } from '../platform/ai.js';

describe('Outreach & Mention Growth Platform', () => {
  let configProvider: ConfigurationProvider;
  let eventBus: VerificationEventBus;
  let scorer: OpportunityScorer;
  let generator: OutreachGenerator;
  let engine: OutreachEngine;
  let aiProvider: AIProvider;

  beforeEach(() => {
    configProvider = new ConfigurationProvider();
    eventBus = new VerificationEventBus();
    aiProvider = {
      name: 'MockAI',
      generate: vi.fn().mockResolvedValue('Subject: Draft Email\n\nHi there!'),
      analyze: vi.fn(),
      fix: vi.fn()
    };
    
    scorer = new OpportunityScorer(configProvider);
    generator = new OutreachGenerator(aiProvider, configProvider);
    engine = new OutreachEngine(scorer, generator, eventBus);
  });

  describe('OpportunityScorer', () => {
    it('should assign the highest base score to UNLINKED_MENTION', () => {
      const opp1: Opportunity = { id: '1', url: 'https://a.com', type: 'UNLINKED_MENTION', domainRating: 50, discoveredAt: '' };
      const opp2: Opportunity = { id: '2', url: 'https://b.com', type: 'NARRATIVE_GAP', domainRating: 50, discoveredAt: '' };
      
      const score1 = scorer.score(opp1);
      const score2 = scorer.score(opp2);
      
      expect(score1).toBeGreaterThan(score2);
    });

    it('should reject low DR opportunities (score = 0)', () => {
      const opp: Opportunity = { id: '1', url: 'https://a.com', type: 'UNLINKED_MENTION', domainRating: 10, discoveredAt: '' };
      // default config minDomainRating is 30
      expect(scorer.score(opp)).toBe(0);
    });
  });

  describe('OutreachGenerator', () => {
    it('should customize prompt based on UNLINKED_MENTION type', async () => {
      const opp: Opportunity = { id: '1', url: 'https://a.com', type: 'UNLINKED_MENTION', domainRating: 60, discoveredAt: '' };
      await generator.generateDraft(opp);
      
      const prompt = vi.mocked(aiProvider.generate).mock.calls[0][0];
      expect(prompt).toContain('mentioned our brand without linking');
    });

    it('should customize prompt based on NARRATIVE_GAP type', async () => {
      const opp: Opportunity = { id: '2', url: 'https://b.com', type: 'NARRATIVE_GAP', domainRating: 60, discoveredAt: '' };
      await generator.generateDraft(opp);
      
      const prompt = vi.mocked(aiProvider.generate).mock.calls[0][0];
      expect(prompt).toContain('mentioned our competitors');
    });
  });

  describe('OutreachEngine', () => {
    it('should discover, score, and transition states correctly', async () => {
      const emitSpy = vi.spyOn(eventBus, 'publish');
      const opp: Opportunity = { id: 'opp_123', url: 'https://high-dr.com', type: 'UNLINKED_MENTION', domainRating: 80, discoveredAt: '' };
      
      // 1. Discover
      const scoredOpp = engine.discover(opp);
      expect(scoredOpp.state).toBe('SCORED');
      expect(emitSpy).toHaveBeenCalledWith('OpportunityDiscovered', expect.anything());

      // 2. Draft
      const draftedOpp = await engine.generateDraft('opp_123');
      expect(draftedOpp.state).toBe('DRAFTED');
      expect(draftedOpp.draftContent).toBe('Subject: Draft Email\n\nHi there!');
      expect(emitSpy).toHaveBeenCalledWith('OutreachDraftGenerated', expect.anything());

      // 3. Acquire
      const acquiredOpp = engine.updateState('opp_123', 'ACQUIRED');
      expect(acquiredOpp.state).toBe('ACQUIRED');
      expect(emitSpy).toHaveBeenCalledWith('LinkStatusChanged', { url: 'https://high-dr.com', status: 'ACQUIRED' });
    });
  });
});
