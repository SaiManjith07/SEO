import type { Rule, Finding, Context } from './types.js';

export interface VerificationEventMap {
  VerificationStarted: { context: Context };
  RuleStarted: { ruleId: string };
  RuleCompleted: { ruleId: string; passed: boolean; findingsCount: number };
  FindingCreated: { finding: Finding };
  AiRecommendationGenerated: { ruleId: string; recommendation: string };
  FixApplied: { file: string; ruleId: string; success: boolean };
  ReportGenerated: { format: string; path: string };
}

export type VerificationEventKey = keyof VerificationEventMap;
export type VerificationListener<K extends VerificationEventKey> = (
  payload: VerificationEventMap[K]
) => void | Promise<void>;

export class VerificationEventBus {
  private listeners: Map<string, Set<any>> = new Map();

  subscribe<K extends VerificationEventKey>(
    event: K,
    listener: VerificationListener<K>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  async publish<K extends VerificationEventKey>(
    event: K,
    payload: VerificationEventMap[K]
  ): Promise<void> {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const listener of set) {
      try {
        await listener(payload);
      } catch (err) {
        console.error(`[EventBus] Error in listener for ${event}:`, err);
      }
    }
  }
}
