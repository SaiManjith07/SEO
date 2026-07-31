import { EffectivenessResult } from './types.js';
import { TrackingMetrics } from '../tracking/types.js';

export class EffectivenessEvaluator {
  public evaluate(
    url: string, 
    prePublishMetrics: TrackingMetrics, 
    postPublishMetrics: TrackingMetrics
  ): EffectivenessResult {
    const positionDelta = prePublishMetrics.averagePosition - postPublishMetrics.averagePosition; // positive means improvement
    // CTR isn't directly in TrackingMetrics but we could use totalImpressions or add CTR later.
    // For now we assume a simple ctrDelta calculation placeholder.
    const ctrDelta = 0; 
    
    let classification: 'SUCCESS' | 'NEUTRAL' | 'FAILED' = 'NEUTRAL';

    if (positionDelta >= 2 || ctrDelta > 0.02) {
      classification = 'SUCCESS';
    } else if (positionDelta <= -2 || ctrDelta < -0.02) {
      classification = 'FAILED';
    }

    return {
      url,
      classification,
      positionDelta,
      ctrDelta
    };
  }
}
