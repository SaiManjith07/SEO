import { PageMetadata, DecayScore, LifecycleState } from './types.js';
import { TrackingMetrics } from '../tracking/types.js';

export interface QueueItem {
  id: string;
  metadata: PageMetadata;
  metrics: TrackingMetrics;
  score: DecayScore;
  state: LifecycleState;
  currentContent: string;
  queuedAt: string;
}

export class RefreshQueue {
  private queue: QueueItem[] = [];

  public enqueue(item: Omit<QueueItem, 'id' | 'state' | 'queuedAt'>): QueueItem {
    const queuedItem: QueueItem = {
      ...item,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      state: 'QUEUED',
      queuedAt: new Date().toISOString()
    };
    this.queue.push(queuedItem);
    this.sortQueue();
    return queuedItem;
  }

  public dequeue(): QueueItem | undefined {
    return this.queue.shift();
  }

  public getQueue(): QueueItem[] {
    return [...this.queue];
  }

  public peek(): QueueItem | undefined {
    return this.queue[0];
  }

  public size(): number {
    return this.queue.length;
  }

  public updateState(id: string, newState: LifecycleState) {
    const item = this.queue.find(q => q.id === id);
    if (item) {
      item.state = newState;
    }
  }

  private sortQueue() {
    // Sort descending by score (highest score first)
    this.queue.sort((a, b) => b.score.score - a.score.score);
  }
}
