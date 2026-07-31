import { describe, it, expect } from 'vitest';
import { TrackingAnalyzer } from './analyzer.js';
import { SERPSnapshot } from './types.js';

describe('TrackingAnalyzer', () => {
  const analyzer = new TrackingAnalyzer();

  const createSnapshot = (date: string, position: number): SERPSnapshot => ({
    id: `snap-${date}`,
    keyword: 'seo',
    url: 'https://test.com',
    date,
    position,
    impressions: 100,
    ctr: 0.1,
    clicks: 10,
    searchEngine: 'google',
    country: 'us',
    language: 'en',
    device: 'desktop',
    location: 'NY',
    featureType: 'organic',
    crawlSource: 'mock'
  });

  it('should return null for empty snapshots', () => {
    expect(analyzer.analyze([])).toBeNull();
  });

  it('should calculate basic position metrics', () => {
    const snapshots = [
      createSnapshot('2026-07-28', 10),
      createSnapshot('2026-07-29', 5),
      createSnapshot('2026-07-30', 8)
    ];

    const metrics = analyzer.analyze(snapshots);
    expect(metrics).toBeDefined();
    expect(metrics?.averagePosition).toBeCloseTo(7.66, 1);
    expect(metrics?.bestPosition).toBe(5);
    expect(metrics?.worstPosition).toBe(10);
  });

  it('should calculate moving averages', () => {
    const snapshots = Array.from({ length: 10 }).map((_, i) => createSnapshot(`2026-07-${10+i}`, 10 - i)); // Positions 10 down to 1

    const metrics = analyzer.analyze(snapshots);
    
    // 7 day moving average of positions: 4, 3, 2, 1, 0? No, positions are:
    // Day 0: 10, Day 1: 9, Day 2: 8, Day 3: 7, Day 4: 6, Day 5: 5, Day 6: 4, Day 7: 3, Day 8: 2, Day 9: 1
    // Last 7 days: Day 3 to Day 9 -> positions: 7, 6, 5, 4, 3, 2, 1
    // Sum = 28. Average = 4.
    expect(metrics?.movingAverage7Day).toBe(4);
    
    // 30 day not possible with 10 records
    expect(metrics?.movingAverage30Day).toBeUndefined();
  });

  it('should calculate trend direction properly', () => {
    // Improving positions (values getting smaller)
    const upTrend = [
      createSnapshot('2026-07-28', 20),
      createSnapshot('2026-07-29', 15),
      createSnapshot('2026-07-30', 10),
      createSnapshot('2026-07-31', 5)
    ];
    
    expect(analyzer.analyze(upTrend)?.trendDirection).toBe('UP');

    // Declining positions (values getting larger)
    const downTrend = [
      createSnapshot('2026-07-28', 5),
      createSnapshot('2026-07-29', 10),
      createSnapshot('2026-07-30', 15),
      createSnapshot('2026-07-31', 20)
    ];

    expect(analyzer.analyze(downTrend)?.trendDirection).toBe('DOWN');

    // Flat positions
    const flatTrend = [
      createSnapshot('2026-07-28', 5),
      createSnapshot('2026-07-29', 5),
      createSnapshot('2026-07-30', 5),
      createSnapshot('2026-07-31', 5)
    ];

    expect(analyzer.analyze(flatTrend)?.trendDirection).toBe('FLAT');
  });
});
