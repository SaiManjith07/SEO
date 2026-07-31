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

function topologicalSort(rules: Rule[]): Rule[] {
  const visited = new Set<string>();
  const temp = new Set<string>();
  const result: Rule[] = [];

  function visit(rule: Rule) {
    if (temp.has(rule.id)) {
      throw new Error(`Circular dependency detected in rules: ${rule.id}`);
    }
    if (!visited.has(rule.id)) {
      temp.add(rule.id);
      const deps = rule.dependencies || [];
      for (const depId of deps) {
        const depRule = rules.find(r => r.id === depId);
        if (depRule) {
          visit(depRule);
        }
      }
      temp.delete(rule.id);
      visited.add(rule.id);
      result.push(rule);
    }
  }

  for (const rule of rules) {
    visit(rule);
  }
  return result;
}

/**
 * Run every rule whose `needs` matches the context kind, respecting topological
 * dependencies. If a prerequisite rule fails with errors/warnings, dependent rules are pruned.
 */
export function runRules(ctx: Context, config?: SeoKitConfig): RunResult {
  const started = Date.now();
  const findings: Finding[] = [];
  const skipped: string[] = [];
  let rulesRun = 0;

  const sortedRules = topologicalSort([...registry.values()]);
  const failedRules = new Set<string>();

  for (const rule of sortedRules) {
    if (rule.needs !== ctx.kind) {
      skipped.push(rule.id);
      continue;
    }

    const severity = resolveSeverity(rule.id, rule.severity, config);
    if (severity === 'off') {
      skipped.push(rule.id);
      continue;
    }

    // Check if any prerequisite has failed
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
      failedRules.add(rule.id); // Cascade pruning
      continue;
    }

    rulesRun++;

    try {
      const ruleFindings = rule.check(ctx);
      let ruleFailed = false;
      for (const finding of ruleFindings) {
        const resolvedSev = severity as Finding['severity'];
        findings.push({ ...finding, severity: resolvedSev });
        if (resolvedSev === 'error' || resolvedSev === 'warning') {
          ruleFailed = true;
        }
      }
      if (ruleFailed) {
        failedRules.add(rule.id);
      }
    } catch (err) {
      findings.push({
        ruleId: rule.id,
        severity: 'info',
        message: `Rule "${rule.id}" threw: ${
          err instanceof Error ? err.message : String(err)
        }`,
      });
      failedRules.add(rule.id);
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
