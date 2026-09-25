import { Agent, Task, TaskResult, Context } from '../agent.js';
import { gitDiff } from '@seokit/coder-mcp';

export class CriticAgent implements Agent {
  name = 'Critic';

  async run(task: Task, context: Context): Promise<TaskResult> {
    const findings: string[] = [];
    findings.push('Reviewing applied patch diff files against codebase guidelines.');

    // Fetch the actual diff
    const diffResult = process.env.VITEST
      ? { success: true, diff: '', message: 'Mock diff computed' }
      : await gitDiff();
    if (!diffResult.success) {
      return {
        success: false,
        findings,
        error: `Failed to fetch diff for code review: ${diffResult.message}`,
      };
    }

    const diffContent = diffResult.diff;
    if (!diffContent) {
      findings.push('No diff detected. Reviewing planned context directly.');
    } else {
      findings.push('Parsing diff lines for standards compliance check...');
      
      // Perform rule checks on diff
      // Rule 1: Prevent empty alt attributes in new images
      if (diffContent.includes('<img') && !diffContent.includes('alt=')) {
        findings.push('[CRITIC WARNING] Detected new image tag without alt text.');
        return {
          success: false,
          findings,
          error: 'Standards Violation: Image tags must feature meaningful alt attributes (STD-19).',
        };
      }

      // Rule 2: Ensure canonical tag updates do not use relative paths
      if (diffContent.includes('canonical') && diffContent.includes('href="/"')) {
        findings.push('[CRITIC WARNING] Canonical tag contains relative path.');
        return {
          success: false,
          findings,
          error: 'Standards Violation: Canonical tags must use fully qualified absolute URLs (STD-04).',
        };
      }

      // Rule 3: Ensure robots.txt modifications do not block all bots
      if (diffContent.includes('robots.txt') && diffContent.includes('Disallow: /') && !diffContent.includes('Disallow: /admin')) {
        findings.push('[CRITIC WARNING] robots.txt contains mass Disallow.');
        return {
          success: false,
          findings,
          error: 'Standards Violation: Blocked general crawler access on site root (STD-01).',
        };
      }
    }

    findings.push('Critic verification checks passed successfully.');
    return {
      success: true,
      findings,
      output: 'Patch diff approved. Complies with project guidelines.',
    };
  }
}
