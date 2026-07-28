import type {
  Context,
  Finding,
  Rule,
  RunResult,
  SeoKitConfig,
  Severity,
} from './types.js';

/**
 * The rule registry. Rules self-register at import time via `defineRule`,
 * or are added explicitly by an adapter (letting users inject their own).
 */
const registry = new Map<string, Rule>();

export function defineRule<C extends Context>(rule: Rule<C>): Rule<C> {
  if (registry.has(rule.id)) {
    throw new Error(`Duplicate rule id: ${rule.id}`);
  }
  registry.set(rule.id, rule as Rule);
  return rule;
}

export function registerRule(rule: Rule): void {
  registry.set(rule.id, rule);
}

export function getRules(): Rule[] {
  return [...registry.values()];
}

export function getRule(id: string): Rule | undefined {
  return registry.get(id);
}

function resolveSeverity(
  ruleId: string,
  fallback: Exclude<Severity, 'off'>,
  config?: SeoKitConfig,
): Severity {
  const entry = config?.rules?.[ruleId];
  if (entry === undefined) return fallback;
  return Array.isArray(entry) ? entry[0] : entry;
}

/**
 * Run every rule whose `needs` matches the context kind.
 *
 * Rules are pure and independent, so a throwing rule is downgraded to an
 * `info` finding rather than failing the whole run. A crashing rule should
 * never block a developer.
 */
export function runRules(ctx: Context, config?: SeoKitConfig): RunResult {
  const started = Date.now();
  const findings: Finding[] = [];
  const skipped: string[] = [];
  let rulesRun = 0;

  for (const rule of registry.values()) {
    if (rule.needs !== ctx.kind) {
      skipped.push(rule.id);
      continue;
    }

    const severity = resolveSeverity(rule.id, rule.severity, config);
    if (severity === 'off') {
      skipped.push(rule.id);
      continue;
    }

    rulesRun++;

    try {
      for (const finding of rule.check(ctx)) {
        findings.push({ ...finding, severity: severity as Finding['severity'] });
      }
    } catch (err) {
      findings.push({
        ruleId: rule.id,
        severity: 'info',
        message: `Rule "${rule.id}" threw: ${
          err instanceof Error ? err.message : String(err)
        }`,
      });
    }
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

/** Typed config helper, so `seokit.config.ts` gets autocomplete. */
export function defineConfig(config: SeoKitConfig): SeoKitConfig {
  return config;
}
