#!/usr/bin/env node
import { WorkspaceManager } from '@seokit/workspace';
import { EventBus } from '@seokit/events';
import { VerificationOrchestrator } from '@seokit/orchestrator';
import { DiagnosticMapper } from '@seokit/diagnostics';

// Import capability plugins to trigger self-registration
import '@seokit/plugin-seo';
import '@seokit/plugin-performance';
import '@seokit/plugin-accessibility';
import '@seokit/plugin-aeo';
import '@seokit/plugin-geo';

async function main() {
  const args = process.argv;
  const command = args[2];
  const target = args[3] || process.cwd();

  if (command !== 'verify') {
    console.log(`
SEOKit v2 Platform CLI Client
Usage:
  seokit-v2 verify [path]       Run verification orchestrations on workspace path
`);
    process.exit(0);
  }

  console.log(`[CLI] Launching SEOKit v2 platform run against: ${target}`);

  const wsManager = new WorkspaceManager();
  const eventBus = new EventBus();
  const orchestrator = new VerificationOrchestrator(wsManager, eventBus);

  // Subscribe to central EventBus to stream updates live to terminal
  eventBus.subscribe('ProgressEvent', (ev) => {
    console.log(`[Progress ${ev.payload.percent}%] ${ev.payload.message}`);
  });

  eventBus.subscribe('RuleCompleted', (ev) => {
    const status = ev.payload.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`  ${status} | Page: ${ev.payload.page} | Rule: ${ev.payload.ruleId}`);
  });

  try {
    const session = await orchestrator.createSession({
      workspaceRoot: target,
      plugins: ['seo', 'performance', 'accessibility', 'aeo', 'geo'],
      options: {}
    });

    const evidences = await orchestrator.runVerification(session.id);

    console.log('\n--- Mapped IDE Diagnostics ---');
    const diagnostics = DiagnosticMapper.mapCollection(evidences, target);
    diagnostics.forEach(diag => {
      const lineNum = diag.range.start.line + 1;
      const charNum = diag.range.start.character + 1;
      const statusIcon = diag.severity === 'error' ? '✗ ERROR' : '⚠ WARN';
      console.log(`${statusIcon} | Line ${lineNum}:${charNum} | ${diag.message}`);
    });

    console.log('\n--- Final Verification Summary ---');
    const passedCount = evidences.filter(e => e.passed).length;
    const failedCount = evidences.filter(e => !e.passed).length;
    console.log(`Total checks: ${evidences.length} | Passed: ${passedCount} | Failed: ${failedCount}`);

    await orchestrator.closeSession(session.id);
    process.exit(failedCount > 0 ? 1 : 0);
  } catch (err: any) {
    console.error(`[CLI ERROR] Verification run failed:`, err.message);
    process.exit(1);
  }
}

main();
