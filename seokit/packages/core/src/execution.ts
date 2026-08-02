import type { Rule, Finding, Context, RunResult, SeoKitConfig } from './types.js';
import { VerificationEventBus } from './events.js';
import { DagRulesScheduler } from './scheduler.js';

export interface ExecutionProvider {
  execute(
    rules: Rule[],
    ctx: Context,
    config?: SeoKitConfig,
    eventBus?: VerificationEventBus
  ): Promise<RunResult>;
}

export class LocalExecutionProvider implements ExecutionProvider {
  async execute(
    rules: Rule[],
    ctx: Context,
    config?: SeoKitConfig,
    eventBus?: VerificationEventBus
  ): Promise<RunResult> {
    if (config) {
      ctx.config = config;
    }
    const scheduler = new DagRulesScheduler();
    const plan = scheduler.schedule(rules);

    const started = Date.now();
    const findings: Finding[] = [];
    const skipped: string[] = [];
    let rulesRun = 0;
    const failedRules = new Set<string>();

    if (eventBus) {
      eventBus.publish('VerificationStarted', { context: ctx }).catch(() => {});
    }

    for (const level of plan.levels) {
      for (const rule of level) {
        if (rule.needs !== ctx.kind) {
          skipped.push(rule.id);
          continue;
        }

        const severity = config?.rules?.[rule.id] || rule.severity;
        if (severity === 'off') {
          skipped.push(rule.id);
          continue;
        }

        // Conditional execution check
        if (rule.condition && !rule.condition(ctx)) {
          skipped.push(rule.id);
          if (eventBus) {
            eventBus.publish('RuleSkipped', { ruleId: rule.id, reason: 'Condition not met' }).catch(() => {});
          }
          continue;
        }

        // Prerequisite validation & Skip/Failure propagation
        const deps = rule.dependencies || [];
        let hasFailedDep = false;
        for (const depId of deps) {
          if (failedRules.has(depId)) {
            hasFailedDep = true;
            break;
          }
        }

        if (hasFailedDep) {
          skipped.push(rule.id);
          failedRules.add(rule.id);
          if (eventBus) {
            eventBus.publish('RuleSkipped', { ruleId: rule.id, reason: 'Dependency check failed' }).catch(() => {});
          }
          continue;
        }

        rulesRun++;
        if (eventBus) {
          eventBus.publish('RuleStarted', { ruleId: rule.id }).catch(() => {});
        }

        try {
          const ruleFindings = await Promise.resolve(rule.check(ctx));
          let ruleFailed = false;
          for (const finding of ruleFindings) {
            const resolvedSev = (Array.isArray(severity) ? severity[0] : severity) as Finding['severity'];
            const fullFinding = { ...finding, severity: resolvedSev };
            findings.push(fullFinding);
            
            if (eventBus) {
              eventBus.publish('FindingCreated', { finding: fullFinding }).catch(() => {});
            }

            if (resolvedSev === 'error' || resolvedSev === 'warning') {
              ruleFailed = true;
            }
          }
          if (ruleFailed) {
            failedRules.add(rule.id);
            if (eventBus) {
              eventBus.publish('RuleFailed', { ruleId: rule.id, error: 'Rule assertions failed' }).catch(() => {});
            }
          }

          if (eventBus) {
            eventBus.publish('RuleCompleted', {
              ruleId: rule.id,
              passed: !ruleFailed,
              findingsCount: ruleFindings.length
            }).catch(() => {});
          }
        } catch (err: any) {
          const infoFinding: Finding = {
            ruleId: rule.id,
            severity: 'info',
            message: `Rule "${rule.id}" threw: ${err.message}`,
            fix: 'Review the rule implementation code and fix the runtime exception.',
          };
          findings.push(infoFinding);
          failedRules.add(rule.id);

          if (eventBus) {
            eventBus.publish('FindingCreated', { finding: infoFinding }).catch(() => {});
            eventBus.publish('RuleCompleted', {
              ruleId: rule.id,
              passed: false,
              findingsCount: 1
            }).catch(() => {});
            eventBus.publish('RuleFailed', { ruleId: rule.id, error: err.message }).catch(() => {});
          }
        }
      }
    }

    if (eventBus) {
      eventBus.publish('VerificationCompleted', { durationMs: Date.now() - started, findingsCount: findings.length }).catch(() => {});
    }

    return {
      findings,
      skipped,
      stats: {
        errors: findings.filter((f) => f.severity === 'error').length,
        warnings: findings.filter((f) => f.severity === 'warning').length,
        infos: findings.filter((f) => f.severity === 'info').length,
        rulesRun,
        durationMs: Date.now() - started,
      },
    };
  }
}

export class ThreadPoolExecutionProvider implements ExecutionProvider {
  async execute(
    rules: Rule[],
    ctx: Context,
    config?: SeoKitConfig,
    eventBus?: VerificationEventBus
  ): Promise<RunResult> {
    if (config) {
      ctx.config = config;
    }
    const scheduler = new DagRulesScheduler();
    const plan = scheduler.schedule(rules);

    const started = Date.now();
    const findings: Finding[] = [];
    const skipped: string[] = [];
    let rulesRun = 0;
    const failedRules = new Set<string>();

    if (eventBus) {
      eventBus.publish('VerificationStarted', { context: ctx }).catch(() => {});
    }

    // Process levels sequentially, executing rule level items concurrently
    for (const level of plan.levels) {
      const promises = level.map(async (rule) => {
        if (rule.needs !== ctx.kind) {
          skipped.push(rule.id);
          return;
        }

        const severity = config?.rules?.[rule.id] || rule.severity;
        if (severity === 'off') {
          skipped.push(rule.id);
          return;
        }

        // Conditional execution check
        if (rule.condition && !rule.condition(ctx)) {
          skipped.push(rule.id);
          if (eventBus) {
            eventBus.publish('RuleSkipped', { ruleId: rule.id, reason: 'Condition not met' }).catch(() => {});
          }
          return;
        }

        // Prerequisite validation
        const deps = rule.dependencies || [];
        let hasFailedDep = false;
        for (const depId of deps) {
          if (failedRules.has(depId)) {
            hasFailedDep = true;
            break;
          }
        }

        if (hasFailedDep) {
          skipped.push(rule.id);
          failedRules.add(rule.id);
          if (eventBus) {
            eventBus.publish('RuleSkipped', { ruleId: rule.id, reason: 'Dependency check failed' }).catch(() => {});
          }
          return;
        }

        rulesRun++;
        if (eventBus) {
          eventBus.publish('RuleStarted', { ruleId: rule.id }).catch(() => {});
        }

        try {
          const ruleFindings = await Promise.resolve(rule.check(ctx));
          let ruleFailed = false;
          for (const finding of ruleFindings) {
            const resolvedSev = (Array.isArray(severity) ? severity[0] : severity) as Finding['severity'];
            const fullFinding = { ...finding, severity: resolvedSev };
            findings.push(fullFinding);

            if (eventBus) {
              eventBus.publish('FindingCreated', { finding: fullFinding }).catch(() => {});
            }

            if (resolvedSev === 'error' || resolvedSev === 'warning') {
              ruleFailed = true;
            }
          }
          if (ruleFailed) {
            failedRules.add(rule.id);
            if (eventBus) {
              eventBus.publish('RuleFailed', { ruleId: rule.id, error: 'Rule assertions failed' }).catch(() => {});
            }
          }

          if (eventBus) {
            eventBus.publish('RuleCompleted', {
              ruleId: rule.id,
              passed: !ruleFailed,
              findingsCount: ruleFindings.length
            }).catch(() => {});
          }
        } catch (err: any) {
          const infoFinding: Finding = {
            ruleId: rule.id,
            severity: 'info',
            message: `Rule "${rule.id}" threw: ${err.message}`,
            fix: 'Review the rule implementation code and fix the runtime exception.',
          };
          findings.push(infoFinding);
          failedRules.add(rule.id);

          if (eventBus) {
            eventBus.publish('FindingCreated', { finding: infoFinding }).catch(() => {});
            eventBus.publish('RuleCompleted', {
              ruleId: rule.id,
              passed: false,
              findingsCount: 1
            }).catch(() => {});
            eventBus.publish('RuleFailed', { ruleId: rule.id, error: err.message }).catch(() => {});
          }
        }
      });

      await Promise.all(promises);
    }

    if (eventBus) {
      eventBus.publish('VerificationCompleted', { durationMs: Date.now() - started, findingsCount: findings.length }).catch(() => {});
    }

    return {
      findings,
      skipped,
      stats: {
        errors: findings.filter((f) => f.severity === 'error').length,
        warnings: findings.filter((f) => f.severity === 'warning').length,
        infos: findings.filter((f) => f.severity === 'info').length,
        rulesRun,
        durationMs: Date.now() - started,
      },
    };
  }
}
