import { ClassifiedTask, ExecutionPlan, PlanStep } from '../types.js';
import { registry } from '../index.js';
import { OrchestrationError } from '../types.js';
import { RunMode } from '../mode/index.js';
import { SeoKitConfig } from '../config/index.js';

export function plan(
  task: ClassifiedTask,
  options: { mode: RunMode; config: SeoKitConfig; registry: typeof registry }
): ExecutionPlan {
  const steps: PlanStep[] = [];
  const skipped: ExecutionPlan['skipped'] = [];
  const agents = options.registry.agents.list();

  for (const cap of task.capabilities) {
    const matchingAgents = agents.filter(a => a.capabilities?.includes(cap) && a.canHandle(task));
    
    if (matchingAgents.length === 0) {
      throw new Error(`no agent for capability ${cap}`);
    }

    // Filter by mode
    const modeAgents = matchingAgents.filter(a => !a.modes || a.modes.includes(options.mode));
    if (modeAgents.length === 0) {
      skipped.push({
        capability: cap,
        reason: 'mode-mismatch',
        sourceIds: [],
        hint: `Available agents for ${cap} do not support mode ${options.mode}`
      });
      continue;
    }

    // Filter by data sources enabled in config
    const availableAgents = modeAgents.filter(a => {
      const requiredSources = a.requires?.dataSources || [];
      if (requiredSources.length === 0) return true;
      return requiredSources.every(src => options.config.sources[src]?.enabled);
    });

    if (availableAgents.length === 0) {
      // Find what's missing from the top priority agent among modeAgents
      modeAgents.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      const topAgent = modeAgents[0];
      const requiredSources = topAgent.requires?.dataSources || [];
      const disabledSources = requiredSources.filter(src => !options.config.sources[src]?.enabled);

      skipped.push({
        capability: cap,
        reason: 'source-disabled',
        sourceIds: disabledSources,
        hint: `seokit sources enable ${disabledSources.join(' ')}`
      });
      continue;
    }

    // Check credentials (for agents that are enabled)
    const validAgents = availableAgents.filter(a => {
      const creds = a.requires?.credentials || [];
      return creds.every(c => process.env[c]);
    });

    if (validAgents.length === 0) {
      availableAgents.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      const topAgent = availableAgents[0];
      const creds = topAgent.requires?.credentials || [];
      const missingCreds = creds.filter(c => !process.env[c]);

      skipped.push({
        capability: cap,
        reason: 'credentials-missing',
        sourceIds: topAgent.requires?.dataSources || [],
        hint: `Missing credentials: ${missingCreds.join(', ')}`
      });
      continue;
    }

    validAgents.sort((a, b) => {
      const pA = a.priority || 0;
      const pB = b.priority || 0;
      if (pA !== pB) return pB - pA;
      return a.id.localeCompare(b.id);
    });

    const selectedAgents = validAgents.filter((a, idx) => idx === 0 || a.runAlongside);

    for (const a of selectedAgents) {
      steps.push({
        id: a.id,
        agentId: a.id,
        dependsOn: a.requires?.peers || [],
        params: task.params
      });
    }
  }

  // Build graph
  const graph: Record<string, string[]> = {};
  for (const step of steps) {
    graph[step.id] = step.dependsOn.filter(dep => steps.some(s => s.id === dep));
  }

  // Cycle detection
  const visited = new Set<string>();
  const stack = new Set<string>();
  const path: string[] = [];

  function hasCycle(node: string): boolean {
    if (stack.has(node)) {
      path.push(node);
      return true;
    }
    if (visited.has(node)) return false;

    visited.add(node);
    stack.add(node);
    path.push(node);

    const neighbors = graph[node] || [];
    for (const n of neighbors) {
      if (hasCycle(n)) return true;
    }

    stack.delete(node);
    path.pop();
    return false;
  }

  for (const node of Object.keys(graph)) {
    if (!visited.has(node)) {
      if (hasCycle(node)) {
        throw new Error(`Cycle detected in plan graph: ${path.join(' -> ')}`);
      }
    }
  }

  // Group into batches
  const batches: string[][] = [];
  const resolved = new Set<string>();

  let remaining = steps.map(s => s.id);
  while (remaining.length > 0) {
    const currentBatch = remaining.filter(id => {
      const deps = graph[id] || [];
      return deps.every(dep => resolved.has(dep));
    });

    if (currentBatch.length === 0) {
      throw new Error('Could not resolve batches (possibly missing dependencies)');
    }

    batches.push(currentBatch);
    currentBatch.forEach(id => resolved.add(id));
    remaining = remaining.filter(id => !resolved.has(id));
  }

  return {
    steps,
    batches,
    totalSteps: steps.length,
    skipped
  };
}
