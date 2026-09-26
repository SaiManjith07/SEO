import { ClassifiedTask } from '../classify/index.js';
import { registry } from '../index.js';
import { OrchestrationError } from '../types.js';

export interface PlanStep {
  id: string;
  agentId: string;
  dependsOn: string[];
  params: Record<string, unknown>;
}

export interface ExecutionPlan {
  steps: PlanStep[];
  batches: string[][];
  totalSteps: number;
}

export function plan(task: ClassifiedTask): ExecutionPlan {
  const steps: PlanStep[] = [];
  const agents = registry.agents.list();

  for (const cap of task.capabilities) {
    const matchingAgents = agents.filter(a => a.capabilities?.includes(cap) && a.canHandle(task));
    
    if (matchingAgents.length === 0) {
      throw new Error(`no agent for capability ${cap}`);
    }

    matchingAgents.sort((a, b) => {
      const pA = a.priority || 0;
      const pB = b.priority || 0;
      if (pA !== pB) return pB - pA;
      return a.id.localeCompare(b.id);
    });

    const selectedAgents = matchingAgents.filter((a, idx) => idx === 0 || a.runAlongside);

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
      // Should not happen if acyclic, but just in case
      throw new Error('Could not resolve batches (possibly missing dependencies)');
    }

    batches.push(currentBatch);
    currentBatch.forEach(id => resolved.add(id));
    remaining = remaining.filter(id => !resolved.has(id));
  }

  return {
    steps,
    batches,
    totalSteps: steps.length
  };
}
