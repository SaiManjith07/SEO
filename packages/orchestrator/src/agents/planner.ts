import { Agent, Task, TaskResult, Context } from '../agent.js';

export class PlannerAgent implements Agent {
  name = 'Planner';

  async run(task: Task, context: Context): Promise<TaskResult> {
    const findings: string[] = [];
    findings.push(`Orchestrated plan generated for task goal: "${task.goal}"`);

    // Extract target URL from goal if present to propagate to subtasks context
    const urlMatch = task.goal.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      task.context.url = urlMatch[0];
    }

    const subTasks: Task[] = [];
    const lowerGoal = task.goal.toLowerCase();

    if (
      lowerGoal.includes('seo') || 
      lowerGoal.includes('optimize') || 
      lowerGoal.includes('audit') || 
      lowerGoal.includes('aeo') ||
      lowerGoal.includes('geo')
    ) {
      subTasks.push(
        {
          id: `${task.id}_inspect`,
          type: 'inspect',
          goal: 'Inspect raw codebase files, robots.txt, sitemaps, and folder structures.',
          context: { ...task.context },
          maxLoops: 1,
          successCriteria: ['Workspace files indexed successfully'],
        },
        {
          id: `${task.id}_knowledge`,
          type: 'knowledge',
          goal: 'Retrieve relevant SEO, rendering, and content standards from the Knowledge Base.',
          context: { ...task.context },
          maxLoops: 1,
          successCriteria: ['Standards loaded successfully'],
        },
        {
          id: `${task.id}_code_fix`,
          type: 'coding',
          goal: 'Apply meta tags, schema markup, or SSR configuration updates, and verify local build/tests.',
          context: { ...task.context },
          maxLoops: task.maxLoops,
          successCriteria: ['Build passes', 'Lint checks pass', 'Local HTML test suite passes'],
        },
        {
          id: `${task.id}_critic`,
          type: 'critic',
          goal: 'Validate applied patch files and git diff against strict repository standards.',
          context: { ...task.context },
          maxLoops: 1,
          successCriteria: ['Critic validation checks pass without revision'],
        },
        {
          id: `${task.id}_verify`,
          type: 'verify',
          goal: 'Verify site indexability and Core Web Vitals targets using external tool endpoints.',
          context: { ...task.context },
          maxLoops: 1,
          successCriteria: ['Verification targets achieved'],
        }
      );
    } else {
      // General developer tasks
      subTasks.push(
        {
          id: `${task.id}_inspect`,
          type: 'inspect',
          goal: 'Inspect files matching task parameters.',
          context: { ...task.context },
          maxLoops: 1,
          successCriteria: ['File listing indexed'],
        },
        {
          id: `${task.id}_code_fix`,
          type: 'coding',
          goal: task.goal,
          context: { ...task.context },
          maxLoops: task.maxLoops,
          successCriteria: ['Build passes', 'Tests pass'],
        }
      );
    }

    return {
      success: true,
      findings,
      output: JSON.stringify(subTasks, null, 2),
    };
  }
}
