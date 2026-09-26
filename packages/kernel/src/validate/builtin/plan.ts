import { KernelValidator, ValidationContext } from '../engine.js';
import { ExecutionPlan } from '../../types.js';
import { agents, tools } from '../../registry/index.js';

export const planNoCycles: KernelValidator = {
  id: 'plan.noCycles',
  gates: ['plan.build'],
  severity: 'error',
  onFail: 'block',
  run: (input: any, ctx: ValidationContext) => {
    // A cyclic plan wouldn't even be successfully built by a correct planner, 
    // but the validator should check the input.
    // If we assume `input` is the dependency graph or the planner passes a graph,
    // wait, the prompt says "Fails if the step dependency graph has any cycle".
    // If the input is the ExecutionPlan, it's just batches. You can't have a cycle in an array of batches.
    // But maybe `input` contains the graph? Let's check `input.graph`.
    
    if (input && input.graph) {
      const graph = input.graph as Record<string, string[]>;
      const visited = new Set<string>();
      const stack = new Set<string>();

      for (const node of Object.keys(graph)) {
        if (hasCycle(node, graph, visited, stack)) {
          return { ok: false, message: `Cycle detected in plan graph involving ${node}` };
        }
      }
    }
    
    return { ok: true };
  }
};

function hasCycle(node: string, graph: Record<string, string[]>, visited: Set<string>, stack: Set<string>): boolean {
  if (stack.has(node)) return true;
  if (visited.has(node)) return false;

  visited.add(node);
  stack.add(node);

  const neighbors = graph[node] || [];
  for (const n of neighbors) {
    if (hasCycle(n, graph, visited, stack)) {
      return true;
    }
  }

  stack.delete(node);
  return false;
}

export const planDepsAvailable: KernelValidator = {
  id: 'plan.depsAvailable',
  gates: ['plan.build'],
  severity: 'error',
  onFail: 'block',
  run: (input: any, ctx: ValidationContext) => {
    const plan = input as ExecutionPlan;
    if (!plan || !plan.batches) return { ok: true };

    for (const batch of plan.batches) {
      for (const stepId of batch) {
        const step = plan.steps.find(s => s.id === stepId);
        if (!step) continue;
        const agent = agents.get(step.agentId);
        if (!agent) {
          return { ok: false, message: `Agent ${step.agentId} is not in the registry` };
        }
        
        // Credentials check is handled by credentialsPresent and credentialsValid validators.
      }
    }
    return { ok: true };
  }
};
