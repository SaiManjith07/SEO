export interface PlatformEvent {
  type: string;
  timestamp: string;
  payload: any;
  source: string;
}

export type EventCallback = (event: PlatformEvent) => void | Promise<void>;

export class EventBus {
  private listeners: Map<string, EventCallback[]> = new Map();

  public subscribe(eventType: string, callback: EventCallback): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
  }

  public async emit(event: PlatformEvent): Promise<void> {
    const callbacks = this.listeners.get(event.type) || [];
    const allCallbacks = this.listeners.get('*') || []; // Wildcard listeners (e.g. for logging)
    
    const combined = [...callbacks, ...allCallbacks];
    for (const cb of combined) {
      try {
        await cb(event);
      } catch (err) {
        console.error(`Error in event listener for ${event.type}:`, err);
      }
    }
  }
}
