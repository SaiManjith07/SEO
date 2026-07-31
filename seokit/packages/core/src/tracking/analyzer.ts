import { SERPSnapshot, TrackingMetrics } from './types';

export class TrackingAnalyzer {
  
  /**
   * Generates tracking metrics for a specific keyword from a time-series of snapshots.
   * Assumes snapshots are sorted by date ascending.
   */
  public analyze(snapshots: SERPSnapshot[]): TrackingMetrics | null {
    if (!snapshots || snapshots.length === 0) {
      return null;
    }

    const keyword = snapshots[0].keyword;
    const latestSnapshot = snapshots[snapshots.length - 1];
    
    let sumPosition = 0;
    let sumImpressions = 0;
    let bestPosition = Infinity;
    let worstPosition = -Infinity;

    for (const snap of snapshots) {
      sumPosition += snap.position;
      sumImpressions += snap.impressions;
      if (snap.position < bestPosition) bestPosition = snap.position;
      if (snap.position > worstPosition) worstPosition = snap.position;
    }

    const averagePosition = sumPosition / snapshots.length;
    const averageImpressions = sumImpressions / snapshots.length;
    const totalImpressions = sumImpressions;

    // Moving Averages
    const movingAverage7Day = this.calculateMovingAverage(snapshots, 7);
    const movingAverage30Day = this.calculateMovingAverage(snapshots, 30);

    // Volatility (Standard Deviation of position)
    const volatility = this.calculateVolatility(snapshots, averagePosition);

    // Trend & Momentum
    const { trendDirection, momentum } = this.calculateTrendAndMomentum(snapshots);

    return {
      keyword,
      averagePosition,
      bestPosition,
      worstPosition,
      averageImpressions,
      totalImpressions,
      movingAverage7Day,
      movingAverage30Day,
      volatility,
      trendDirection,
      momentum
    };
  }

  private calculateMovingAverage(snapshots: SERPSnapshot[], days: number): number | undefined {
    if (snapshots.length < days) return undefined;
    const slice = snapshots.slice(-days);
    const sum = slice.reduce((acc, curr) => acc + curr.position, 0);
    return sum / slice.length;
  }

  private calculateVolatility(snapshots: SERPSnapshot[], averagePosition: number): number {
    if (snapshots.length <= 1) return 0;
    const sumSq = snapshots.reduce((acc, curr) => acc + Math.pow(curr.position - averagePosition, 2), 0);
    return Math.sqrt(sumSq / snapshots.length);
  }

  private calculateTrendAndMomentum(snapshots: SERPSnapshot[]): { trendDirection: 'UP' | 'DOWN' | 'FLAT', momentum: number } {
    if (snapshots.length < 2) {
      return { trendDirection: 'FLAT', momentum: 0 };
    }

    // Simple linear regression slope for trend
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    const n = snapshots.length;

    for (let i = 0; i < n; i++) {
      const x = i;
      const y = snapshots[i].position;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    let trendDirection: 'UP' | 'DOWN' | 'FLAT' = 'FLAT';
    // Position decreases mean improvement (UP trend in search performance)
    if (slope < -0.1) trendDirection = 'UP';
    else if (slope > 0.1) trendDirection = 'DOWN';

    // Momentum: recent change vs older average
    const recent = snapshots.slice(-3).reduce((acc, curr) => acc + curr.position, 0) / Math.min(3, n);
    const older = snapshots.slice(0, Math.max(1, n - 3)).reduce((acc, curr) => acc + curr.position, 0) / Math.max(1, n - 3);
    
    // Positive momentum means improving (position dropping)
    const momentum = older - recent;

    return { trendDirection, momentum };
  }
}
