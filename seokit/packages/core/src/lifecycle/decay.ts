import { TrackingMetrics } from '../tracking/types';
import { PageMetadata, DecayScore } from './types';
import { VerificationEventBus } from '../events';
import { ConfigurationProvider } from '../config/provider';

export class DecayDetector {
  private eventBus: VerificationEventBus;
  private configProvider: ConfigurationProvider;

  constructor(eventBus: VerificationEventBus, configProvider: ConfigurationProvider) {
    this.eventBus = eventBus;
    this.configProvider = configProvider;
  }

  public evaluate(metrics: TrackingMetrics, metadata: PageMetadata): DecayScore {
    const lifecycleConfig = this.configProvider.getSettings().lifecycle;
    
    // Check exclusions
    for (const exclusion of lifecycleConfig.exclusions) {
      if (metadata.url.includes(exclusion)) {
        return this.zeroScore('Excluded by policy');
      }
    }

    const [minPos, maxPos] = lifecycleConfig.positionRange;
    if (metrics.averagePosition < minPos || metrics.averagePosition > maxPos) {
      return this.zeroScore('Position outside target range');
    }

    const isHighImpression = metrics.totalImpressions >= lifecycleConfig.highImpressionThreshold || 
                             metrics.averageImpressions >= (lifecycleConfig.highImpressionThreshold / 30);
    
    if (!isHighImpression) {
      return this.zeroScore('Impressions below threshold');
    }

    // Age Factor (0-40)
    const lastUpdatedDate = new Date(metadata.lastUpdated);
    const currentDate = new Date();
    let monthsDiff = (currentDate.getFullYear() - lastUpdatedDate.getFullYear()) * 12;
    monthsDiff -= lastUpdatedDate.getMonth();
    monthsDiff += currentDate.getMonth();

    const requiredCadence = lifecycleConfig.cadenceMonths[metadata.contentType] || 12;
    const ageRatio = monthsDiff / requiredCadence;
    
    // If not aged enough, it's not decaying yet regardless of other metrics (based on eligibility gate standard)
    if (ageRatio < 1) {
      return this.zeroScore('Not reached refresh cadence yet');
    }
    
    const ageFactor = Math.min(40, (ageRatio - 1) * 20); // Max 40 points

    // Momentum Factor (0-30) (negative momentum -> higher decay score)
    let momentumFactor = 0;
    if (metrics.momentum > 0) { // meaning positions are getting larger (worse)
      momentumFactor = Math.min(30, metrics.momentum * 10);
    }

    // Impression Factor (0-15) (higher impressions -> more important)
    const impressionRatio = metrics.totalImpressions / lifecycleConfig.highImpressionThreshold;
    const impressionFactor = Math.min(15, impressionRatio * 5);

    // Volatility Factor (0-15) (higher volatility -> might need stabilizing)
    const volatilityFactor = Math.min(15, metrics.volatility * 2);

    const totalScore = Math.min(100, ageFactor + momentumFactor + impressionFactor + volatilityFactor);

    const result: DecayScore = {
      score: totalScore,
      factors: {
        ageFactor,
        momentumFactor,
        impressionFactor,
        volatilityFactor
      },
      isDecaying: true, // We already filtered out non-decaying items
      reason: `Decay score: ${totalScore.toFixed(1)} (Age: ${ageFactor.toFixed(1)}, Momentum: ${momentumFactor.toFixed(1)})`
    };

    this.eventBus.publish('ContentDecayDetected', {
      url: metadata.url,
      keyword: metadata.keyword,
      lastUpdated: metadata.lastUpdated,
      reason: result.reason
    });

    return result;
  }

  private zeroScore(reason: string): DecayScore {
    return {
      score: 0,
      factors: { ageFactor: 0, momentumFactor: 0, impressionFactor: 0, volatilityFactor: 0 },
      isDecaying: false,
      reason
    };
  }
}
