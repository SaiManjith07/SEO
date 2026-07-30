export type PlatformEventType =
  | 'WorkspaceOpened'
  | 'VerificationStarted'
  | 'PageParsed'
  | 'RuleCompleted'
  | 'VerificationFinished'
  | 'ProgressEvent'
  | 'CacheHit'
  | 'CacheMiss'
  | 'FrameworkDetected';

export interface PlatformEvent<T = any> {
  type: PlatformEventType;
  payload: T;
  timestamp: string;
}

export type EventCallback = (event: PlatformEvent) => void;

export class EventBus {
  private listeners: Map<PlatformEventType, EventCallback[]> = new Map();

  public subscribe(type: PlatformEventType, callback: EventCallback): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(callback);

    // Return an unsubscribe function
    return () => {
      const list = this.listeners.get(type);
      if (list) {
        this.listeners.set(type, list.filter(cb => cb !== callback));
      }
    };
  }

  public publish(type: PlatformEventType, payload: any): void {
    const event: PlatformEvent = {
      type,
      payload,
      timestamp: new Date().toISOString()
    };

    const list = this.listeners.get(type);
    if (list) {
      for (const callback of list) {
        try {
          callback(event);
        } catch (err) {
          console.error(`[EventBus] Error in listener callback for event type ${type}:`, err);
        }
      }
    }
  }
}
