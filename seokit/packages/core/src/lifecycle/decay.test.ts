import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DecayDetector } from './decay';
import { VerificationEventBus } from '../events';
import { ConfigurationProvider } from '../config/provider';
import { TrackingMetrics } from '../tracking/types';
import { PageMetadata } from './types';

describe('DecayDetector (Scoring Model)', () => {
  let eventBus: VerificationEventBus;
  let detector: DecayDetector;
  let configProvider: ConfigurationProvider;

  beforeEach(() => {
    eventBus = new VerificationEventBus();
    configProvider = new ConfigurationProvider(); // uses defaults
    detector = new DecayDetector(eventBus, configProvider);
  });

  const baseMetrics: TrackingMetrics = {
    keyword: 'seo software',
    averagePosition: 10,
    bestPosition: 8,
    worstPosition: 12,
    averageImpressions: 50,
    totalImpressions: 1500,
    volatility: 1,
    trendDirection: 'FLAT',
    momentum: 0
  };

  const createMetadata = (monthsOld: number, contentType: 'commercial' | 'evergreen'): PageMetadata => {
    const d = new Date();
    d.setMonth(d.getMonth() - monthsOld);
    return {
      url: 'https://example.com/page',
      keyword: 'seo software',
      lastUpdated: d.toISOString(),
      contentType
    };
  };

  it('should return a high score for old content with negative momentum', () => {
    const emitSpy = vi.spyOn(eventBus, 'publish');
    // 6 months old (commercial = 3 mo cadence) -> ageRatio = 2
    const metadata = createMetadata(6, 'commercial');
    
    // High volatility, high momentum (dropping ranks)
    const metrics = { ...baseMetrics, volatility: 5, momentum: 2 }; 

    const result = detector.evaluate(metrics, metadata);

    expect(result.isDecaying).toBe(true);
    expect(result.score).toBeGreaterThan(50);
    expect(result.factors.ageFactor).toBe(20); // (2-1)*20
    expect(result.factors.momentumFactor).toBe(20); // 2 * 10
    expect(result.factors.volatilityFactor).toBe(10); // 5 * 2
    expect(emitSpy).toHaveBeenCalled();
  });

  it('should return 0 score and not decay for content below age cadence', () => {
    const emitSpy = vi.spyOn(eventBus, 'publish');
    const metadata = createMetadata(2, 'commercial'); // 2 < 3

    const result = detector.evaluate(baseMetrics, metadata);

    expect(result.isDecaying).toBe(false);
    expect(result.score).toBe(0);
    expect(result.reason).toContain('Not reached refresh cadence');
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should return 0 score for excluded paths', () => {
    const metadata = createMetadata(6, 'commercial');
    metadata.url = 'https://example.com/archive/page';
    
    const result = detector.evaluate(baseMetrics, metadata);

    expect(result.isDecaying).toBe(false);
    expect(result.score).toBe(0);
    expect(result.reason).toContain('Excluded by policy');
  });

  it('should return 0 score if outside position range', () => {
    const metadata = createMetadata(6, 'commercial');
    const metrics = { ...baseMetrics, averagePosition: 2 }; // Target is 4-15
    
    const result = detector.evaluate(metrics, metadata);

    expect(result.isDecaying).toBe(false);
    expect(result.score).toBe(0);
    expect(result.reason).toContain('Position outside target range');
  });
});
