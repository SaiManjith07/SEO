import { Agent, Task, TaskResult, Context } from '../agent.js';
import * as fs from 'fs';
import * as path from 'path';

export class KnowledgeAgent implements Agent {
  name = 'Knowledge';

  async run(task: Task, context: Context): Promise<TaskResult> {
    const findings: string[] = [];
    const lowerGoal = task.goal.toLowerCase();
    
    // Resolve path to standard files by searching upwards for knowledge-base
    let searchDir = context.workingDir;
    let kbPath = '';
    while (true) {
      const checkPath = path.join(searchDir, 'knowledge-base', 'standards');
      if (fs.existsSync(checkPath)) {
        kbPath = checkPath;
        break;
      }
      const parent = path.dirname(searchDir);
      if (parent === searchDir) break;
      searchDir = parent;
    }
    if (!kbPath) {
      kbPath = path.resolve(context.workingDir, 'knowledge-base', 'standards');
    }
    
    const ruleSummaries: string[] = [];
    
    if (fs.existsSync(kbPath)) {
      try {
        const files = fs.readdirSync(kbPath);
        for (const file of files) {
          if (!file.endsWith('.md')) continue;
          
          const fullPath = path.join(kbPath, file);
          const content = fs.readFileSync(fullPath, 'utf-8');
          
          // Match simple keyword queries to standard files
          const fileName = file.toLowerCase();
          if (
            (lowerGoal.includes('schema') && fileName.includes('schema')) ||
            (lowerGoal.includes('performance') && fileName.includes('performance')) ||
            (lowerGoal.includes('render') && fileName.includes('rendering')) ||
            (lowerGoal.includes('robots') && fileName.includes('access')) ||
            lowerGoal.includes('seo') || lowerGoal.includes('optimize')
          ) {
            findings.push(`Matched rules from KB standard file: ${file}`);
            // Extract the first 3 subheadings (STD tags) to keep it concise
            const matches = content.match(/### STD-\d+ — [^\r\n]+/g) || [];
            ruleSummaries.push(`--- File: ${file} ---`);
            ruleSummaries.push(matches.join('\n'));
          }
        }
      } catch (err: any) {
        findings.push(`Error indexing KB: ${err.message}`);
      }
    } else {
      findings.push(`Knowledge base standards directory not found at: ${kbPath}. Using mock SEO fallback rules.`);
      ruleSummaries.push(
        '### STD-01 — Robots.txt Allowed',
        '### STD-04 — Self-referencing canonical presence',
        '### STD-06 — SSR Wire HTML Content Parity',
        '### STD-09 — JSON-LD Valid Schema structure'
      );
    }

    return {
      success: true,
      findings,
      output: ruleSummaries.join('\n\n'),
    };
  }
}
