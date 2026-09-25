import { DecayDetector } from './decay.js';
import { ContentRefresher } from './refresher.js';
import { PageMetadata } from './types.js';
import { TrackingMetrics } from '../tracking/types.js';
import { RefreshQueue, QueueItem } from './queue.js';
import { WorkflowManager } from './workflow.js';

export class LifecycleEngine {
  private decayDetector: DecayDetector;
  private contentRefresher: ContentRefresher;
  private queue: RefreshQueue;
  private workflow: WorkflowManager;

  constructor(decayDetector: DecayDetector, contentRefresher: ContentRefresher) {
    this.decayDetector = decayDetector;
    this.contentRefresher = contentRefresher;
    this.queue = new RefreshQueue();
    this.workflow = new WorkflowManager();
  }

  /**
   * Evaluates a page and queues it if it's decaying.
   */
  public enqueueIfDecaying(metadata: PageMetadata, metrics: TrackingMetrics, currentContent: string) {
    const score = this.decayDetector.evaluate(metrics, metadata);
    
    if (score.isDecaying) {
      this.queue.enqueue({
        metadata,
        metrics,
        score,
        currentContent
      });
    }
  }

  /**
   * Processes the highest priority item in the queue.
   */
  public async processNextInQueue(): Promise<QueueItem | null> {
    const item = this.queue.dequeue();
    if (!item) return null;

    // Transition to DRAFTING
    const draftingItem = this.workflow.transition(item, 'DRAFTING');

    const metricsContext = `Avg Position: ${item.metrics.averagePosition}, Impressions: ${item.metrics.totalImpressions}, Volatility: ${item.metrics.volatility}, Momentum: ${item.metrics.momentum}`;

    const refreshResult = await this.contentRefresher.generateRefreshDraft(
      item.metadata.url, 
      item.metadata.keyword, 
      item.currentContent,
      item.score.reason,
      metricsContext
    );

    if (refreshResult.status === 'SUCCESS') {
      const reviewItem = this.workflow.transition(draftingItem, 'REVIEW');
      // In a real system, reviewItem would be persisted to DB here
      return reviewItem;
    }

    // if failed, maybe re-queue or transition to another state
    return draftingItem;
  }

  public getQueue() {
    return this.queue;
  }
}
