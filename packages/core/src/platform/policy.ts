import { EvidenceStore, EvidenceRecord } from './store.js';

export interface PerformancePolicy {
  lighthouse?: {
    performance?: number;
    accessibility?: number;
    bestPractices?: number;
    seo?: number;
  };
  webVitals?: {
    lcp?: number;
    inp?: number;
    cls?: number;
  };
}

export interface PolicyProfile {
  require?: string[];
  advisory?: string[];
  performance?: PerformancePolicy;
}

export interface PolicySchema {
  profiles: Record<string, PolicyProfile>;
}

export class PolicyEngine {
  private schema: PolicySchema;
  private evidenceStore: EvidenceStore;

  constructor(schema: PolicySchema, evidenceStore: EvidenceStore) {
    this.schema = schema;
    this.evidenceStore = evidenceStore;
  }

  public evaluateReadiness(profileName: string, taskId: string): boolean {
    const profile = this.schema.profiles[profileName];
    if (!profile) throw new Error(`Profile '${profileName}' not found in policy schema.`);
    
    const evidenceList = this.evidenceStore.listEvidenceForTask(taskId);
    
    if (profile.require && profile.require.length > 0) {
      for (const reqCap of profile.require) {
        const capEvidences = evidenceList.filter(e => e.capabilityId === reqCap);
        if (capEvidences.length === 0) return false;
        const allCapPassed = capEvidences.every(e => e.passed);
        if (!allCapPassed) return false;
      }
    }

    if (profile.performance) {
      const perf = profile.performance;
      for (const ev of evidenceList) {
        try {
          const metrics = JSON.parse(ev.output);
          
          if (perf.webVitals && metrics.webVitals) {
            const pv = perf.webVitals;
            const mv = metrics.webVitals;
            if (pv.lcp !== undefined && mv.lcp > pv.lcp) return false;
            if (pv.inp !== undefined && mv.inp > pv.inp) return false;
            if (pv.cls !== undefined && mv.cls > pv.cls) return false;
          }

          if (perf.lighthouse && metrics.lighthouse) {
            const pl = perf.lighthouse;
            const ml = metrics.lighthouse;
            if (pl.performance !== undefined && ml.performance < pl.performance) return false;
            if (pl.accessibility !== undefined && ml.accessibility < pl.accessibility) return false;
            if (pl.bestPractices !== undefined && ml.bestPractices < pl.bestPractices) return false;
            if (pl.seo !== undefined && ml.seo < pl.seo) return false;
          }
        } catch {
          // Skip if parsing fails
        }
      }
    }
    
    return true; 
  }
}
