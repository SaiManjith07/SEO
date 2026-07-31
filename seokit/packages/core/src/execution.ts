import type { Rule, Finding, Context, RunResult, SeoKitConfig } from './types.js';
import { VerificationEventBus } from './events.js';
import { runRules } from './engine.js';

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
    return runRules(ctx, config, eventBus);
  }
}

export class ThreadPoolExecutionProvider implements ExecutionProvider {
  async execute(
    rules: Rule[],
    ctx: Context,
    config?: SeoKitConfig,
    eventBus?: VerificationEventBus
  ): Promise<RunResult> {
    const started = Date.now();
    const findings: Finding[] = [];
    const skipped: string[] = [];
    let rulesRun = 0;

    if (eventBus) {
      eventBus.publish('VerificationStarted', { context: ctx }).catch(() => {});
    }

    const promises = rules.map(async (rule) => {
      if (rule.needs !== ctx.kind) {
        skipped.push(rule.id);
        return;
      }
      rulesRun++;
      if (eventBus) {
        eventBus.publish('RuleStarted', { ruleId: rule.id }).catch(() => {});
      }
      try {
        const ruleFindings = await Promise.resolve(rule.check(ctx));
        for (const finding of ruleFindings) {
          findings.push(finding);
          if (eventBus) {
            eventBus.publish('FindingCreated', { finding }).catch(() => {});
          }
        }
        if (eventBus) {
          eventBus.publish('RuleCompleted', {
            ruleId: rule.id,
            passed: ruleFindings.length === 0,
            findingsCount: ruleFindings.length
          }).catch(() => {});
        }
      } catch (err: any) {
        const infoFinding: Finding = {
          ruleId: rule.id,
          severity: 'info',
          message: `Rule "${rule.id}" threw in ThreadPool: ${err.message}`,
        };
        findings.push(infoFinding);
        if (eventBus) {
          eventBus.publish('FindingCreated', { finding: infoFinding }).catch(() => {});
        }
      }
    });

    await Promise.all(promises);

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
