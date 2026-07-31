import type { Rule, Finding, Context } from './types.js';

export interface VerificationEventMap {
  VerificationStarted: { context: Context };
  RuleStarted: { ruleId: string };
  RuleCompleted: { ruleId: string; passed: boolean; findingsCount: number };
  FindingCreated: { finding: Finding };
  AiRecommendationGenerated: { ruleId: string; recommendation: string };
  FixApplied: { file: string; ruleId: string; success: boolean };
  VerificationCompleted: { durationMs: number; findingsCount: number };
  VerificationFailed: { error: string };
  RuleSkipped: { ruleId: string; reason: string };
  RuleFailed: { ruleId: string; error: string };
  CacheHit: { filePath: string; ruleId: string };
  CacheMiss: { filePath: string; ruleId: string };
  PluginLoaded: { pluginId: string };
  PluginFailed: { pluginId: string; error: string };
  TrackingAlertTriggered: { alert: import('./tracking/types').AlertEvent };
  TrackingStarted: { keyword: string; date: string; providerName: string };
  TrackingCompleted: { keyword: string; date: string; providerName: string };
  TrackingFailed: { keyword: string; date: string; providerName: string; error: string };
  SnapshotStored: { snapshotId: string; keyword: string };
  ProviderUnavailable: { providerName: string; error: string };
  ProviderRecovered: { providerName: string };
  ContentDecayDetected: { url: string; keyword: string; lastUpdated: string; reason: string };
  RefreshDraftGenerated: { url: string; draftContent: string };
  OpportunityDiscovered: { url: string; type: string; score: number };
  OutreachDraftGenerated: { url: string; draftContent: string };
  LinkStatusChanged: { url: string; status: string };
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
