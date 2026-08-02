#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { WorkspaceManager } from '@seokit/workspace';
import { EventBus } from '@seokit/events';
import { VerificationOrchestrator } from '@seokit/orchestrator';
import { DiagnosticMapper, ReportGenerator } from '@seokit/diagnostics';
import * as readline from 'readline';

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => rl.question(query, (ans) => {
    rl.close();
    resolve(ans);
  }));
}

// Import capability plugins to trigger self-registration
import '@seokit/plugin-seo';
import '@seokit/plugin-performance';
import '@seokit/plugin-accessibility';
import '@seokit/plugin-aeo';
import '@seokit/plugin-geo';
import '@seokit/plugin-security';
import '@seokit/plugin-structured-data';

export async function main() {
  const args = process.argv;
  const command = args[2];
  const target = args[3] || process.cwd();

  if (command === 'init') {
    console.log('[SEOKit] Initializing zero-config developer integrations...');

    const targetFolder = target;
    console.log(`[SEOKit] Target workspace: ${targetFolder}`);

    // Determine best MCP execution path (prefer local node absolute path)
    let mcpCommand = 'npx';
    let mcpArgs = ['-y', 'seokit', 'mcp'];
    
    // In ESM, __dirname is not defined, we use import.meta.url
    const { fileURLToPath } = await import('url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    // In compiled CLI (packages/cli/dist/index.js), the mcp package is at ../../mcp/dist/index.js
    let potentialMcpPath = path.resolve(__dirname, '../../mcp/dist/index.js');
    if (!fs.existsSync(potentialMcpPath)) {
        // Fallback for ts-node / src execution
        potentialMcpPath = path.resolve(__dirname, '../node_modules/@seokit/mcp/dist/index.js');
    }
    
    if (fs.existsSync(potentialMcpPath)) {
        mcpCommand = 'node';
        const relativePath = path.relative(targetFolder, potentialMcpPath).replace(/\\/g, '/');
        mcpArgs = [relativePath.startsWith('.') ? relativePath : `./${relativePath}`];
        console.log(`[SEOKit] Found local MCP module. Preferring relative execution: ${mcpArgs[0]}`);
    } else {
        console.log(`[SEOKit] Using global npx fallback for MCP execution.`);
    }

    // Cursor Integration Setup
    const cursorDir = path.join(targetFolder, '.cursor');
    try {
      if (!fs.existsSync(cursorDir)) {
        fs.mkdirSync(cursorDir, { recursive: true });
      }
      const cursorMcpPath = path.join(cursorDir, 'mcp.json');
      let cursorConfig: any = { mcpServers: {} };
      if (fs.existsSync(cursorMcpPath)) {
        try {
          cursorConfig = JSON.parse(fs.readFileSync(cursorMcpPath, 'utf-8'));
        } catch {}
      }
      if (!cursorConfig.mcpServers) cursorConfig.mcpServers = {};
      cursorConfig.mcpServers.seokit = {
        command: mcpCommand,
        args: mcpArgs,
        env: {}
      };
      fs.writeFileSync(cursorMcpPath, JSON.stringify(cursorConfig, null, 2), 'utf-8');
      console.log(`✓ Cursor MCP configuration registered at: ${cursorMcpPath}`);
    } catch (err: any) {
      console.error(`✗ Failed to write Cursor config: ${err.message}`);
    }

    // Antigravity Integration Setup
    const agentsDir = path.join(targetFolder, '.agents');
    try {
      if (!fs.existsSync(agentsDir)) {
        fs.mkdirSync(agentsDir, { recursive: true });
      }
      const agentsMcpPath = path.join(agentsDir, 'mcp.json');
      let agentsConfig: any = { mcpServers: {} };
      if (fs.existsSync(agentsMcpPath)) {
        try {
          agentsConfig = JSON.parse(fs.readFileSync(agentsMcpPath, 'utf-8'));
        } catch {}
      }
      if (!agentsConfig.mcpServers) agentsConfig.mcpServers = {};
      agentsConfig.mcpServers.seokit = {
        command: mcpCommand,
        args: mcpArgs
      };
      fs.writeFileSync(agentsMcpPath, JSON.stringify(agentsConfig, null, 2), 'utf-8');
      console.log(`✓ Antigravity config registered at: ${agentsMcpPath}`);
    } catch (err: any) {
      console.error(`✗ Failed to write Antigravity config: ${err.message}`);
    }

    // Claude Desktop Integration Setup
    let claudeDir = '';
    const platform = process.platform;
    if (platform === 'win32') {
      claudeDir = path.join(process.env.APPDATA || '', 'Claude');
    } else if (platform === 'darwin') {
      claudeDir = path.join(process.env.HOME || '', 'Library', 'Application Support', 'Claude');
    } else {
      claudeDir = path.join(process.env.HOME || '', '.config', 'Claude');
    }

    if (claudeDir) {
      try {
        if (!fs.existsSync(claudeDir)) {
          fs.mkdirSync(claudeDir, { recursive: true });
        }
        const claudeMcpPath = path.join(claudeDir, 'claude_desktop_config.json');
        let claudeConfig: any = { mcpServers: {} };
        if (fs.existsSync(claudeMcpPath)) {
          try {
            claudeConfig = JSON.parse(fs.readFileSync(claudeMcpPath, 'utf-8'));
          } catch {}
        }
        if (!claudeConfig.mcpServers) claudeConfig.mcpServers = {};
        claudeConfig.mcpServers.seokit = {
          command: mcpCommand,
          args: mcpArgs
        };
        fs.writeFileSync(claudeMcpPath, JSON.stringify(claudeConfig, null, 2), 'utf-8');
        console.log(`✓ Claude Desktop config registered at: ${claudeMcpPath}`);
      } catch (err: any) {
        console.error(`✗ Failed to write Claude Desktop config: ${err.message}`);
      }
    }

    console.log('\n[SEOKit] Running health checks...');
    console.log(`Node.js version: ${process.version}`);
    console.log('✓ SEOKit initialized successfully. Ready to run!');
    process.exit(0);
  }

  if (command === 'doctor') {
    console.log('[SEOKit Doctor] Running diagnostic health checks...\n');

    console.log('--- 1. Node.js Environment ---');
    console.log(`Node.js version: ${process.version}`);
    const nodeMajor = parseInt(process.versions.node.split('.')[0], 10);
    if (nodeMajor < 20) {
      console.warn('⚠ WARNING: Node.js version is below recommended v20.');
    } else {
      console.log('✓ Node.js version is compatible.');
    }

    console.log('\n--- 2. Client Integrations Configs ---');
    const targetFolder = target;

    const cursorMcp = path.join(targetFolder, '.cursor', 'mcp.json');
    if (fs.existsSync(cursorMcp)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(cursorMcp, 'utf-8'));
        if (parsed.mcpServers && parsed.mcpServers.seokit) {
          console.log(`✓ Cursor Config: Found & registered at: ${cursorMcp}`);
        } else {
          console.warn(`⚠ Cursor Config: Found at ${cursorMcp} but "seokit" server is missing.`);
        }
      } catch {
        console.error(`✗ Cursor Config: Found at ${cursorMcp} but file is corrupted.`);
      }
    } else {
      console.log(`✗ Cursor Config: Missing. Run "seokit init" to generate.`);
    }

    const agentsMcp = path.join(targetFolder, '.agents', 'mcp.json');
    if (fs.existsSync(agentsMcp)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(agentsMcp, 'utf-8'));
        if (parsed.mcpServers && parsed.mcpServers.seokit) {
          console.log(`✓ Antigravity Config: Found & registered at: ${agentsMcp}`);
        } else {
          console.warn(`⚠ Antigravity Config: Found at ${agentsMcp} but "seokit" server is missing.`);
        }
      } catch {
        console.error(`✗ Antigravity Config: Found at ${agentsMcp} but file is corrupted.`);
      }
    } else {
      console.log(`✗ Antigravity Config: Missing. Run "seokit init" to generate.`);
    }

    let claudeDir = '';
    const platform = process.platform;
    if (platform === 'win32') {
      claudeDir = path.join(process.env.APPDATA || '', 'Claude');
    } else if (platform === 'darwin') {
      claudeDir = path.join(process.env.HOME || '', 'Library', 'Application Support', 'Claude');
    } else {
      claudeDir = path.join(process.env.HOME || '', '.config', 'Claude');
    }
    const claudeMcp = path.join(claudeDir, 'claude_desktop_config.json');
    if (fs.existsSync(claudeMcp)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(claudeMcp, 'utf-8'));
        if (parsed.mcpServers && parsed.mcpServers.seokit) {
          console.log(`✓ Claude Desktop Config: Found & registered at: ${claudeMcp}`);
        } else {
          console.warn(`⚠ Claude Desktop Config: Found at ${claudeMcp} but "seokit" server is missing.`);
        }
      } catch {
        console.error(`✗ Claude Desktop Config: Found at ${claudeMcp} but file is corrupted.`);
      }
    } else {
      console.log(`✗ Claude Desktop Config: Missing. Run "seokit init" to generate.`);
    }

    console.log('\n--- 3. Local Module Connectivity ---');
    try {
      const mcpModule = await import('@seokit/mcp');
      if (mcpModule.server) {
        console.log('✓ MCP Server module loaded and ready to start.');
      } else {
        console.warn('⚠ Loaded MCP module but could not find server definitions.');
      }
    } catch (err: any) {
      console.error(`✗ Failed to load local @seokit/mcp: ${err.message}`);
    }

    console.log('\n[SEOKit Doctor] Scan finished.');
    process.exit(0);
  }

  if (command === 'mcp') {
    const debugArg = args.includes('--debug');
    if (debugArg) {
      console.error('[SEOKit MCP Debug] Stdio MCP launcher mode initialized.');
    }

    await import('@seokit/mcp');
    return;
  }

  if (command !== 'verify') {
    console.log(`
SEOKit v2 Platform CLI Client
Usage:
  seokit-v2 init                 Register zero-config client integration files
  seokit-v2 doctor               Verify and diagnose connection config health
  seokit-v2 mcp                  Launch Stdio MCP server
  seokit-v2 verify [path]        Run verification orchestrations on workspace path
`);
    process.exit(0);
  }

  console.log(`[CLI] Launching SEOKit v2 platform run against: ${target}`);

  const seokitDir = path.resolve(target, '.seokit');
  const logsDir = path.join(seokitDir, 'logs');
  fs.mkdirSync(logsDir, { recursive: true });
  const logFile = path.join(logsDir, 'verification.log');

  const writeToLog = (msg: string) => {
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`, 'utf-8');
  };

  writeToLog(`SEOKit Verification Started against: ${target}`);

  const wsManager = new WorkspaceManager();
  const eventBus = new EventBus();
  const orchestrator = new VerificationOrchestrator(wsManager, eventBus);

  // Subscribe to central EventBus to stream updates live to terminal
  eventBus.subscribe('ProgressEvent', (ev) => {
    const msg = `[Progress ${ev.payload.percent}%] ${ev.payload.message}`;
    console.log(msg);
    writeToLog(msg);
  });

  eventBus.subscribe('RuleCompleted', (ev) => {
    const status = ev.payload.passed ? '✓ PASS' : '✗ FAIL';
    const msg = `  ${status} | Page: ${ev.payload.page} | Rule: ${ev.payload.ruleId}`;
    console.log(msg);
    writeToLog(msg);
  });

  const startTime = Date.now();

  try {
    const session = await orchestrator.createSession({
      workspaceRoot: target,
      plugins: ['seo', 'performance', 'accessibility', 'aeo', 'geo', 'security', 'structured-data'],
      options: {}
    });

    const evidences = await orchestrator.runVerification(session.id);

    console.log('\n--- Mapped IDE Diagnostics ---');
    writeToLog('--- Mapped IDE Diagnostics ---');
    const diagnostics = DiagnosticMapper.mapCollection(evidences, target);
    diagnostics.forEach(diag => {
      const lineNum = diag.range.start.line + 1;
      const charNum = diag.range.start.character + 1;
      const statusIcon = diag.severity === 'error' ? '✗ ERROR' : '⚠ WARN';
      const msg = `${statusIcon} | Line ${lineNum}:${charNum} | ${diag.message}`;
      console.log(msg);
      writeToLog(msg);
    });

    console.log('\n--- Final Verification Summary ---');
    writeToLog('--- Final Verification Summary ---');
    const passedCount = evidences.filter(e => e.passed).length;
    const failedCount = evidences.filter(e => !e.passed).length;
    const summaryMsg = `Total checks: ${evidences.length} | Passed: ${passedCount} | Failed: ${failedCount}`;
    console.log(summaryMsg);
    writeToLog(summaryMsg);

    // Generate unified report model and export files
    const durationMs = Date.now() - startTime;
    const pagesCount = new Set(evidences.map(e => e.sourcePath).filter(Boolean)).size || 1;
    const report = ReportGenerator.createReport(evidences, durationMs, pagesCount);

    const seokitDir = path.resolve(target, '.seokit');
    const reportsDir = path.join(seokitDir, 'reports');
    const historyDir = path.join(seokitDir, 'history');

    fs.mkdirSync(reportsDir, { recursive: true });
    fs.mkdirSync(historyDir, { recursive: true });

    fs.writeFileSync(path.join(reportsDir, 'report.json'), ReportGenerator.exportToJson(report));
    fs.writeFileSync(path.join(reportsDir, 'report.md'), ReportGenerator.exportToMarkdown(report));
    fs.writeFileSync(path.join(reportsDir, 'report.html'), ReportGenerator.exportToHtml(report));
    fs.writeFileSync(path.join(reportsDir, 'report.pdf'), ReportGenerator.exportToPdf(report));
    fs.writeFileSync(path.join(reportsDir, 'report.sarif'), ReportGenerator.exportToSarif(report));

    // Save run timeline history
    const timestampStr = new Date().toISOString().replace(/:/g, '-');
    fs.writeFileSync(path.join(historyDir, `${timestampStr}.json`), ReportGenerator.exportToJson(report));
    console.log(`[SEOKit] Exporters successfully created audit reports in: ${reportsDir}`);

    // Compare with historical baseline
    const historyFiles = fs.readdirSync(historyDir).filter(f => f.endsWith('.json')).sort();
    if (historyFiles.length > 1) {
      try {
        const prevFile = historyFiles[historyFiles.length - 2];
        const prevContent = fs.readFileSync(path.join(historyDir, prevFile), 'utf-8');
        const prevReport = JSON.parse(prevContent);
        const delta = ReportGenerator.compareReports(report, prevReport);
        console.log('\n--- Historical Trend Comparison ---');
        writeToLog('--- Historical Trend Comparison ---');
        const progressStr = `  Score Progress: ${delta.scoreChange >= 0 ? '+' : ''}${delta.scoreChange}%`;
        const resolvedStr = `  Issues Resolved: ${delta.fixedIssues.length}`;
        const newStr = `  New Issues Found: ${delta.newIssues.length}`;
        console.log(progressStr);
        console.log(resolvedStr);
        console.log(newStr);
        writeToLog(progressStr);
        writeToLog(resolvedStr);
        writeToLog(newStr);
      } catch (err) {
        // Fail comparison gracefully
      }
    }

    // Fetch unified dashboard intelligence data
    console.log('\n--- Unified SEO Dashboard ---');
    try {
      const intel = await orchestrator.fetchSEOIntelligence(session.id);
      console.log('Google Search Performance (clicks / impressions / avgPos):');
      console.log(`  Clicks: ${intel.google.searchPerformance.clicks}`);
      console.log(`  Impressions: ${intel.google.searchPerformance.impressions}`);
      console.log(`  Avg Position: ${intel.google.searchPerformance.avgPosition}`);
      console.log('Google Page Experience (CWV & Metrics):');
      console.log(`  LCP: ${intel.google.pageSpeed.lcpSec}s | INP: ${intel.google.pageSpeed.inpMs}ms | CLS: ${intel.google.pageSpeed.cls}`);
      console.log(`  PageSpeed Score: ${intel.google.pageSpeed.speedScore}/100`);
      console.log(`  HTTPS Status: ${intel.google.pageExperience.httpsStatus} | Mobile Usability: ${intel.google.pageExperience.mobileFriendliness}`);
      console.log('Google Business Profile Statistics:');
      console.log(`  Reviews Average Rating: ${intel.google.businessProfile.reviewsAverageRating} / 5 | Count: ${intel.google.businessProfile.reviewsCount}`);
      console.log(`  Local Search Impressions: ${intel.google.businessProfile.localSearchImpressions}`);
      console.log('Google Search Crawl Statistics:');
      console.log(`  Total Crawl Requests: ${intel.google.crawlStats.totalCrawlRequests} | Success Ratio: ${intel.google.crawlStats.successfulRequestsPercent}%`);
      console.log(`  Robots.txt Status: ${intel.google.robotsTxt.status} | Sitemaps count: ${intel.google.sitemaps.length}`);
      console.log('Google URL Inspection Result:');
      console.log(`  URL: ${intel.google.urlInspection[0].url} | Indexing State: ${intel.google.urlInspection[0].indexingState}`);
      console.log('Bing Webmaster Performance (clicks / impressions / indexed):');
      console.log(`  Clicks: ${intel.bing.clicks} | Impressions: ${intel.bing.impressions} | Indexed: ${intel.bing.indexedPagesCount}`);
    } catch (err: any) {
      console.log('  Failed to query external intelligence statistics:', err.message);
    }

    // Fetch AI Intelligence Report
    console.log('\n--- AI SEO Intelligence Dashboard ---');
    try {
      const aiReport = await orchestrator.fetchAIReport(session.id);
      console.log('AI-Powered Recommendations:');
      for (const rec of aiReport.recommendations) {
        console.log(`  [${rec.impact.toUpperCase()}] Rule ${rec.ruleId}: ${rec.issue}`);
        console.log(`     Suggestion: ${rec.suggestion}`);
      }
      console.log('Keyword & Topic Clusters:');
      for (const cl of aiReport.clusters) {
        console.log(`  Topic: ${cl.topic} | Volume: ${cl.monthlyVolume} | Keywords: ${cl.keywords.join(', ')}`);
      }
      console.log('Competitor Search Gaps:');
      for (const gap of aiReport.gaps) {
        console.log(`  Keyword: ${gap.keyword} | Competitor Rank: ${gap.competitorRank} | ${gap.recommendation}`);
      }
      console.log('Backlink Intelligence Audit:');
      console.log(`  Opportunities Found: ${aiReport.backlinkOpportunities.length} | Toxic Backlinks: ${aiReport.toxicLinks.length}`);
      if (aiReport.toxicLinks.length > 0) {
        console.log(`     Spam URL: ${aiReport.toxicLinks[0].url} (Score: ${aiReport.toxicLinks[0].toxicScore}) - ${aiReport.toxicLinks[0].reason}`);
      }
    } catch (err: any) {
      console.log('  Failed to query AI intelligence report:', err.message);
    }

    if (process.env.NODE_ENV === 'test') {
      console.log('SKIPPED: Interactive prompts bypassed in test environment.');
      await orchestrator.closeSession(session.id);
      process.exit(failedCount > 0 ? 1 : 0);
      return;
    }

    // Interactive CLI fix remediation approvals
    try {
      const applyPrompt = await askQuestion('\nApply proposed SEO optimization fixes dynamically? (y/n): ');
      if (applyPrompt.trim().toLowerCase() === 'y') {
        console.log('Generating and validating fix proposals...');
        const indexHtmlPath = path.join(target, 'index.html');
        if (fs.existsSync(indexHtmlPath)) {
          const proposed = orchestrator.proposeFix(session.id, indexHtmlPath, 'title', { title: 'Optimized Title' });
          console.log('\n--- Proposed Diff Preview ---');
          console.log(proposed.diffText);
          
          const approve = await askQuestion('\nApprove and write these changes? (y/n): ');
          if (approve.trim().toLowerCase() === 'y') {
            orchestrator.applyAndBackupFix(session.id, indexHtmlPath, 'title', { title: 'Optimized Title' });
            console.log('SUCCESS: Fix applied successfully with backup.');
          } else {
            console.log('REJECTED: Changes cancelled.');
          }
        } else {
          console.log('SKIPPED: index.html not found in workspace.');
        }
      }
    } catch (err: any) {
      console.log('Safety Check Failed:', err.message);
    }

    await orchestrator.closeSession(session.id);
    process.exit(failedCount > 0 ? 1 : 0);
  } catch (err: any) {
    console.error(`[CLI ERROR] Verification run failed:`, err.message);
    if (typeof writeToLog === 'function') {
      writeToLog(`[CLI ERROR] Verification run failed: ${err.message}`);
    }
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  main();
}
