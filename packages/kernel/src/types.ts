import { z } from 'zod';

/**
 * Natural language task parsed into capabilities and goals.
 */
export interface ClassifiedTask {
  /** The natural language goal (e.g. "unknown" if not classified properly) */
  goal: string;
  /** The specific capabilities required (e.g., 'audit', 'performance') */
  capabilities: string[];
  /** Target URLs or domains extracted */
  targets?: string[];
  /** Additional inferred context */
  context?: Record<string, any>;
}

/**
 * Represents a tool registered in the kernel.
 */
export interface Tool<TInput = any, TOutput = any> {
  id: string;
  provenance: 'live' | 'cache' | 'mock';
  inputSchema: z.ZodType<TInput>;
  outputSchema: z.ZodType<TOutput>;
  run: (input: TInput) => Promise<TOutput>;
}

/**
 * Provides access to tools and other context for an executing agent.
 */
export interface AgentContext {
  tool: <TOutput = any>(id: string, input: any) => Promise<TOutput>;
}

/**
 * Data shape returned by an agent run.
 */
export interface AgentResult {
  /** Structured findings returned by the agent */
  findings: any[];
  /** Raw data or payload backing the findings */
  raw: any;
  /** Identifiers for data sources used */
  dataSources: string[];
  /** 
   * Provenance of the data. 
   * Any agent returning 'mock' in a production run triggers a validator failure.
   */
  provenance: 'live' | 'cache' | 'mock';
  /** Confidence level of the result */
  confidence: 'high' | 'medium' | 'low';
  /** Any non-fatal errors encountered during execution */
  errors: string[];
}

/**
 * An agent registered to handle specific capabilities.
 */
export interface Agent<TInput = any> {
  id: string;
  version: string;
  capabilities: string[];
  requires?: {
    credentials?: string[];
    peers?: string[]; // Agent IDs required to run before this agent
  };
  inputSchema: z.ZodType<TInput>;
  outputSchema: z.ZodType<any>;
  canHandle: (task: ClassifiedTask) => boolean;
  run: (input: TInput, ctx: AgentContext) => Promise<AgentResult>;
}

/**
 * Step within an execution plan.
 */
export interface ExecutionStep {
  agentId: string;
  input: any;
}

/**
 * Execution plan with parallel batches.
 */
export interface ExecutionPlan {
  /** Arrays of steps that can be run concurrently. Each batch depends on the previous ones. */
  batches: ExecutionStep[][];
}

/**
 * Validated and finalized finding ready for report.
 */
export interface MergedFinding {
  id: string;
  title: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  fix?: string;
  agentId: string;
}

/**
 * Output of the orchestration process.
 */
export interface OrchestrationReport {
  id: string;
  timestamp: string;
  task: string;
  metrics: {
    totalSteps: number;
    successfulSteps: number;
    coverage: number;
  };
  findings: MergedFinding[];
}

export interface OrchestrateOptions {
  traceFile?: string;
  failFast?: boolean;
}

/**
 * Structured error thrown when orchestration or validation fails.
 */
export class OrchestrationError extends Error {
  constructor(
    public gate: string,
    public validatorId: string,
    public agentId: string | undefined,
    public raw: any,
    message: string
  ) {
    super(message);
    this.name = 'OrchestrationError';
  }
}
