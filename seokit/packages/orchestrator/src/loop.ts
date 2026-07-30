import { Task, TaskResult, Context, Message, Agent } from './agent.js';
import { PlannerAgent } from './agents/planner.js';
import { KnowledgeAgent } from './agents/knowledge.js';
import { CodingAgent } from './agents/coding.js';
import { CriticAgent } from './agents/critic.js';
import { ResearchAgent } from './agents/research.js';
import { VerificationAgent } from './agents/verification.js';
import { FileStorageProvider } from '@seokit/core';


export interface OrchestratorLog {
  agentName: string;
  taskId: string;
  success: boolean;
  findings: string[];
  output?: string;
  error?: string;
}

export class AgentOrchestrator {
  private planner = new PlannerAgent();
  private agents: Record<string, Agent> = {
    inspect: new CodingAgent(), // Inspect uses coding agent fs operations
    knowledge: new KnowledgeAgent(),
    coding: new CodingAgent(),
    critic: new CriticAgent(),
    research: new ResearchAgent(),
    verify: new VerificationAgent(),
  };

  async runOrchestration(goal: string, workingDir: string = process.cwd(), maxLoops: number = 5): Promise<{ success: boolean; logs: OrchestratorLog[] }> {
    const logs: OrchestratorLog[] = [];
    const storage = new FileStorageProvider(workingDir);
    const context: Context = {
      projectId: 'project_' + Date.now(),
      workingDir,
      messages: [],
      memory: {},
      storage,
    };

    // 1. Planner initializes subtask queue
    const rootTask: Task = {
      id: 'task_root',
      type: 'plan',
      goal,
      context: {},
      maxLoops,
      successCriteria: ['Completed feedback validation loop'],
    };

    const planResult = await this.planner.run(rootTask, context);
    logs.push({
      agentName: this.planner.name,
      taskId: rootTask.id,
      success: planResult.success,
      findings: planResult.findings,
      output: planResult.output,
    });

    if (!planResult.success || !planResult.output) {
      this.persistExecution(false, logs, [], workingDir);
      return { success: false, logs };
    }

    const subTasks: Task[] = JSON.parse(planResult.output);
    let patchContext = '';

    const subTaskRetryCounts: Record<string, number> = {};
    let taskIndex = 0;
    let totalStepBacks = 0;
    const maxStepBacks = 5;

    while (taskIndex < subTasks.length) {
      const subTask = subTasks[taskIndex];
      const agent = this.agents[subTask.type];

      if (!agent) {
        logs.push({
          agentName: 'System',
          taskId: subTask.id,
          success: false,
          findings: [`No agent registered for type: ${subTask.type}`],
          error: `Agent handler not found`,
        });
        this.persistExecution(false, logs, subTasks, workingDir);
        return { success: false, logs };
      }

      // Propagate dynamic variables
      if (patchContext) {
        subTask.context.proposedPatch = patchContext;
      }

      const runResult = await agent.run(subTask, context);
      logs.push({
        agentName: agent.name,
        taskId: subTask.id,
        success: runResult.success,
        findings: runResult.findings,
        output: runResult.output,
        error: runResult.error,
      });

      if (runResult.success) {
        if (runResult.patchApplied) {
          patchContext = runResult.patchApplied;
        }
        taskIndex++;
      } else {
        const errorMsg = runResult.error || 'Unknown execution failure';

        // Check if we need to step back
        if (subTask.type === 'critic' || subTask.type === 'verify') {
          const codingIndex = subTasks.findIndex(t => t.type === 'coding');
          if (codingIndex >= 0 && totalStepBacks < maxStepBacks) {
            totalStepBacks++;

            const codingTask = subTasks[codingIndex];
            codingTask.context.lastFailedAgent = subTask.type;
            codingTask.context.criticFeedback = errorMsg;
            codingTask.context.failedAgentFindings = runResult.findings;
            codingTask.context.stepBackCount = totalStepBacks;

            logs.push({
              agentName: 'System',
              taskId: subTask.id,
              success: false,
              findings: [`Failure in ${subTask.type} agent: ${errorMsg}. Routing back to Coding agent (Step-back ${totalStepBacks}/${maxStepBacks}).`],
              error: errorMsg,
            });

            taskIndex = codingIndex;
            continue;
          }
        }

        // Default per-task retry logic
        const currentRetries = subTaskRetryCounts[subTask.id] || 0;
        if (currentRetries < subTask.maxLoops) {
          subTaskRetryCounts[subTask.id] = currentRetries + 1;
          subTask.context.lastError = errorMsg;
          subTask.context.retryCount = currentRetries + 1;
          logs.push({
            agentName: 'System',
            taskId: subTask.id,
            success: false,
            findings: [`Retrying task ${subTask.id} (Attempt ${currentRetries + 1}/${subTask.maxLoops})`],
            error: errorMsg,
          });
        } else {
          logs.push({
            agentName: 'System',
            taskId: subTask.id,
            success: false,
            findings: [`Task failed after maximum retries. Halting workflow.`],
            error: errorMsg,
          });
          this.persistExecution(false, logs, subTasks, workingDir);
          return { success: false, logs };
        }
      }
    }

    this.persistExecution(true, logs, subTasks, workingDir);
    return { success: true, logs };
  }

  private persistExecution(success: boolean, logs: OrchestratorLog[], subTasks: Task[], workingDir: string): void {
    let errorsCount = 0;
    let warningsCount = 0;
    for (const log of logs) {
      if (!log.success) {
        errorsCount++;
      }
      for (const f of log.findings) {
        const lf = f.toLowerCase();
        if (lf.includes('error') || lf.includes('violation') || lf.includes('failure')) {
          errorsCount++;
        } else if (lf.includes('warning') || lf.includes('warn')) {
          warningsCount++;
        }
      }
    }

    const finalScore = success ? 1.0 : Math.max(0, 1.0 - errorsCount * 0.2);
    console.log(`[Summary] Execution finished. success=${success}, score=${finalScore}, errors=${errorsCount}, warnings=${warningsCount}`);
  }
}
