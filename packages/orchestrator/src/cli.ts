#!/usr/bin/env node
import { AgentOrchestrator } from './loop.js';

async function main() {
  const goal = process.argv.slice(2).join(' ') || 'Optimize project SEO and verify standard configurations';
  console.log(`\n=== Starting SEOKit Multi-Agent Orchestrator ===`);
  console.log(`Goal: "${goal}"\n`);

  const orchestrator = new AgentOrchestrator();
  const { success, logs } = await orchestrator.runOrchestration(goal);

  for (const log of logs) {
    const status = log.success ? 'PASS' : 'FAIL';
    console.log(`[${status}] Agent: ${log.agentName} (Task: ${log.taskId})`);
    for (const find of log.findings) {
      console.log(`  - ${find}`);
    }
    if (log.error) {
      console.log(`  - ERROR: ${log.error}`);
    }
    console.log('');
  }

  if (success) {
    console.log('=== Orchestration succeeded! ===');
    process.exit(0);
  } else {
    console.log('=== Orchestration failed. ===');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal orchestrator error:', err);
  process.exit(1);
});
