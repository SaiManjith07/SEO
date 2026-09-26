export type GateName =
  | 'task.intake'
  | 'plan.build'
  | 'agent.beforeRun'
  | 'agent.afterRun'
  | 'tool.beforeRun'
  | 'tool.afterRun'
  | 'merge.before'
  | 'merge.after'
  | 'report.beforeEmit';
