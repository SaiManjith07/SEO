import { describe, it, expect } from 'vitest';
import { calculatePageRank } from './pagerank.js';

describe('PageRank Analyzer', () => {
  it('handles an empty graph safely', () => {
    const ranks = calculatePageRank(new Map());
    expect(ranks.size).toBe(0);
  });

  it('calculates equal rank for unconnected nodes', () => {
    const graph = new Map<string, string[]>([
      ['A', []],
      ['B', []],
      ['C', []],
    ]);
    const ranks = calculatePageRank(graph);
    
    expect(ranks.get('A')).toBeCloseTo(1 / 3);
    expect(ranks.get('B')).toBeCloseTo(1 / 3);
    expect(ranks.get('C')).toBeCloseTo(1 / 3);
  });

  it('correctly boosts rank of highly linked nodes', () => {
    // B and C link to A. A links to nobody.
    // A should have the highest PageRank.
    const graph = new Map<string, string[]>([
      ['A', []],
      ['B', ['A']],
      ['C', ['A']],
    ]);
    const ranks = calculatePageRank(graph);
    
    const rankA = ranks.get('A')!;
    const rankB = ranks.get('B')!;
    const rankC = ranks.get('C')!;

    expect(rankA).toBeGreaterThan(rankB);
    expect(rankA).toBeGreaterThan(rankC);
  });
});
