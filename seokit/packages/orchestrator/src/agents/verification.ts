import { Agent, Task, TaskResult, Context } from '../agent.js';
import { 
  fetchPage, 
  VerificationEngine, 
  StorageProvider, 
  PolicyEngine, 
  ExecutableRule,
  PolicySchema,
  EvidenceRecord,
  bootstrapVerificationEngine
} from '@seokit/core';
import { seoPlugin } from '@seokit/plugin-seo';
import { performancePlugin } from '@seokit/plugin-performance';
import { accessibilityPlugin } from '@seokit/plugin-accessibility';
import { aeoPlugin } from '@seokit/plugin-aeo';
import { geoPlugin } from '@seokit/plugin-geo';

export class VerificationAgent implements Agent {
  name = 'Verification';

  async run(task: Task, context: Context): Promise<TaskResult> {
    const findings: string[] = [];
    findings.push('Initiating live deployment verification checks.');

    const urlMatch = task.goal.match(/https?:\/\/[^\s]+/) || (task.context.url && [task.context.url]);
    
    if (!urlMatch) {
      findings.push('1. [VERIFICATION FAILURE] No target URL found in goal or context.');
      return {
        success: false,
        findings,
        output: 'Verification failed: No target URL was provided.'
      };
    }

    const targetUrl = urlMatch[0];
    findings.push(`1. Crawling target page for live verification: ${targetUrl}`);

    try {
      const pageCtx = await fetchPage(targetUrl, { render: false });
      
      if (pageCtx.status >= 400) {
        findings.push(`   [VERIFICATION FAILURE] Live fetch failed with status HTTP ${pageCtx.status}`);
        return {
          success: false,
          findings,
          output: `Verification failed: target URL returned status HTTP ${pageCtx.status}`
        };
      }

      findings.push(`   Successfully fetched page (HTTP ${pageCtx.status})`);

      const verificationEngine = bootstrapVerificationEngine([
        seoPlugin,
        performancePlugin,
        accessibilityPlugin,
        aeoPlugin,
        geoPlugin
      ]);
      const storage = context.storage;

      // Executing verification suite
      const evidences = await verificationEngine.verifyProject(pageCtx);
      for (const ev of evidences) {
        findings.push(`   Result [${ev.source}]: ${ev.passed ? 'PASS' : 'FAIL'} - ${ev.output}`);
        const evidence: EvidenceRecord = {
          id: `ev_${ev.capabilityId}_${ev.source}_${Date.now()}`,
          schemaVersion: 1,
          taskId: task.id,
          executionId: context.projectId,
          capabilityId: ev.capabilityId!,
          ruleId: ev.ruleId!,
          treeHash: 'mock-tree-hash',
          ruleVersion: ev.ruleVersion!,
          validatorVersion: '1.0.0',
          capabilityVersion: '1.0.0',
          frameworkSdkVersion: '1.0.0',
          passed: ev.passed,
          output: ev.output,
          timestamp: new Date().toISOString(),
          fixPlan: ev.fixPlan
        };
        storage.evidence.saveEvidence(evidence);
      }

      const policySchema: PolicySchema = {
        profiles: {
          production: {
            require: ['seo.metadata', 'seo.canonical'],
            performance: {
              lighthouse: {
                performance: 80,
                accessibility: 90,
                bestPractices: 90,
                seo: 90
              },
              webVitals: {
                lcp: 2.5,
                inp: 200,
                cls: 0.1
              }
            }
          }
        }
      };

      const policyEngine = new PolicyEngine(policySchema, storage.evidence);
      const isReady = policyEngine.evaluateReadiness('production', task.id);

      if (isReady) {
        findings.push('3. Policy evaluation passed: Production readiness requirements satisfied.');
        return {
          success: true,
          findings,
          output: 'Verification successful. Deployed pages satisfy all target visibility and performance policies.'
        };
      } else {
        findings.push('3. [VERIFICATION FAILURE] Policy evaluation failed: Under-performing metrics or failed requirements.');
        return {
          success: false,
          findings,
          output: 'Verification failed: Policy engine evaluated status as not ready.'
        };
      }

    } catch (err: any) {
      findings.push(`   [VERIFICATION FAILURE] Encountered validator system error: ${err.message}`);
      return {
        success: false,
        findings,
        output: `Verification system error: ${err.message}`
      };
    }
  }
}
