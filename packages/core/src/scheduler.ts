import type { Rule, Context } from './types.js';

export interface RulesExecutionPlan {
  /** Sequential levels/batches of rules. Rules in the same level run in parallel. */
  levels: Rule[][];
}

export class DagRulesScheduler {
  /**
   * Build a dependency graph, perform cycle detection, and construct
   * an execution plan divided into parallel levels.
   */
  schedule(rules: Rule[]): RulesExecutionPlan {
    const visited = new Set<string>();
    const temp = new Set<string>();
    const levelsMap = new Map<string, number>();

    // Step 1: DFS Cycle Detection and Level Assignment
    function visit(rule: Rule): number {
      if (temp.has(rule.id)) {
        throw new Error(`Circular dependency detected in rules: ${rule.id}`);
      }
      if (visited.has(rule.id)) {
        return levelsMap.get(rule.id) || 0;
      }

      temp.add(rule.id);
      let maxDepLevel = -1;

      const deps = rule.dependencies || [];
      for (const depId of deps) {
        const depRule = rules.find((r) => r.id === depId);
        if (depRule) {
          const depLevel = visit(depRule);
          maxDepLevel = Math.max(maxDepLevel, depLevel);
        }
      }

      temp.delete(rule.id);
      visited.add(rule.id);

      const ruleLevel = maxDepLevel + 1;
      levelsMap.set(rule.id, ruleLevel);
      return ruleLevel;
    }

    for (const rule of rules) {
      visit(rule);
    }

    // Step 2: Group rules by their level
    const levelsList: Rule[][] = [];
    for (const rule of rules) {
      const lvl = levelsMap.get(rule.id) || 0;
      if (!levelsList[lvl]) {
        levelsList[lvl] = [];
      }
      levelsList[lvl].push(rule);
    }

    // Filter out empty slots
    const levels = levelsList.filter(Boolean);

    return { levels };
  }
}
