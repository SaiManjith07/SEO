import { TaskRecord, TaskStatus, TaskStore } from './store.js';

export interface ExecutionState {
  taskId: string;
  step: number;
  retries: number;
  lastError?: string;
  context: any;
}

export class ExecutionEngine {
  public async executeTask(task: TaskRecord, context: any): Promise<void> {
    // This is a stub for executing tasks.
    // In the full implementation, it will coordinate with FrameworkAdapters
    // and Capability modules to execute the necessary operations.
    task.status = 'IN_PROGRESS';
    // Stub execution
  }
}

export class WorkflowEngine {
  private store: TaskStore;
  private executor: ExecutionEngine;
  private stateMap: Map<string, ExecutionState> = new Map();

  constructor(store: TaskStore, executor: ExecutionEngine) {
    this.store = store;
    this.executor = executor;
  }

  public async startWorkflow(taskId: string, context: any): Promise<void> {
    const task = this.store.getTask(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    const state: ExecutionState = {
      taskId,
      step: 0,
      retries: 0,
      context,
    };
    this.stateMap.set(taskId, state);

    try {
      await this.executor.executeTask(task, context);
      task.status = 'VERIFYING';
      this.store.saveTask(task);
    } catch (err: any) {
      state.lastError = err.message;
      task.status = 'FAILED';
      this.store.saveTask(task);
    }
  }

  public topologicalSort(capabilities: { id: string, dependencies: string[] }[]): string[] {
    const sorted: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const capMap = new Map(capabilities.map(c => [c.id, c]));

    const visit = (capId: string) => {
      if (visiting.has(capId)) throw new Error(`Cycle detected involving capability: ${capId}`);
      if (visited.has(capId)) return;

      visiting.add(capId);
      const cap = capMap.get(capId);
      if (cap && cap.dependencies) {
        for (const dep of cap.dependencies) {
          visit(dep);
        }
      }
      visiting.delete(capId);
      visited.add(capId);
      sorted.push(capId);
    };

    for (const cap of capabilities) {
      if (!visited.has(cap.id)) {
        visit(cap.id);
      }
    }

    return sorted;
  }

  public resumeWorkflow(taskId: string): void {
    // Stub for resuming workflows that crashed or yielded
  }

  public rollbackWorkflow(taskId: string): void {
    // Stub for rollback
  }
}
