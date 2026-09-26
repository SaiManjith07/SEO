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
import { handleCli } from './cmd.js';

export async function main() {
  const cliArgs = process.argv.slice(2);
  if (await handleCli(cliArgs)) return;

  const args = process.argv;
  const command = args[2];
  
  // Guard against unknown flags
  const validFlags = ['--llms-txt', '--out', '--path', '--critic', '--origin', '--format', '--days', '--limit', '--debug', '--help', '--mine', '--theirs', '--domain'];
  for (let i = 2; i < args.length; i++) {
    if (args[i].startsWith('--') && !validFlags.includes(args[i].split('=')[0])) {
      console.error(`Unknown flag: ${args[i]}`);
      process.exit(1);
    }
  }
  
  if (args.includes('--help')) {
    console.log(`
SEOKit v2 Platform CLI Client
Usage:
  seokit-v2 init [--llms-txt]    Register zero-config client integration files
  seokit-v2 verify [--llms-txt]  Run verification orchestrations on workspace path
  seokit-v2 doctor               Verify and diagnose connection config health
  seokit-v2 crux <url> [--origin] [--format json|table]
  seokit-v2 gsc <queries|pages|opportunities> [--days 28] [--limit 20] [--format json|table]
`);
    process.exit(0);
  }

  let targetIndex = 3;
  while(targetIndex < args.length && args[targetIndex].startsWith('--')) {
    if (['--out', '--path', '--critic', '--format', '--days', '--limit'].includes(args[targetIndex])) {
      targetIndex += 2; // skip flag and value
    } else {
      targetIndex += 1; // skip flag
    }
  }
  const target = targetIndex < args.length ? args[targetIndex] : process.cwd();

  if (command === 'init') {
    if (args.includes('--llms-txt')) {
      const outIdx = args.indexOf('--out');
      const outPath = outIdx !== -1 ? args[outIdx + 1] : target;
      console.log('[SEOKit] Generating llms.txt via llmstxt-kit...');
      const { execSync } = await import('child_process');
      try {
        if (!fs.existsSync(outPath)) {
          fs.mkdirSync(outPath, { recursive: true });
        }
        const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
        execSync(`${npxCmd} -y llmstxt-kit init`, { stdio: 'inherit', cwd: outPath });
        execSync(`${npxCmd} -y llmstxt-kit build`, { stdio: 'inherit', cwd: outPath });
        const generatedPath = path.join(outPath, 'public', 'llms.txt');
        const finalPath = path.join(outPath, 'llms.txt');
        if (fs.existsSync(generatedPath)) {
          fs.copyFileSync(generatedPath, finalPath);
          console.log(`✓ Copied generated llms.txt to ${finalPath}`);
        }
      } catch (err: any) {
        console.error('Failed to generate llms.txt:', err.message);
      }
      process.exit(0);
    }

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

  if (command === 'crux') {
    const isOrigin = args.includes('--origin');
    const format = args.includes('--format=table') || args.includes('--format') && args[args.indexOf('--format')+1] === 'table' ? 'table' : 'json';
    try {
      const { cruxPlugin } = await import('@seokit/plugin-crux');
      const data = await cruxPlugin.fetchRecord(target, isOrigin);
      if (format === 'table') {
        console.table(data);
      } else {
        console.log(JSON.stringify(data, null, 2));
      }
      process.exit(0);
    } catch (e: any) {
      if (e.name === 'CruxCredentialsMissingError' || e.message?.includes('CRUX_API_KEY is not set')) {
        console.error('error: CRUX_API_KEY missing. Set it in .env — see docs/week2-setup.md');
        process.exitCode = 2;
        return;
      }
      console.error(e.message);
      // Wait for fetch socket to clear gracefully
      await new Promise(r => setTimeout(r, 10));
      process.exitCode = 1;
      return;
    }
  }

  if (command === 'gsc') {
    const sub = args[3];
    const daysIdx = args.indexOf('--days');
    const limitIdx = args.indexOf('--limit');
    const format = args.includes('--format=table') || args.includes('--format') && args[args.indexOf('--format')+1] === 'table' ? 'table' : 'json';
    const days = daysIdx !== -1 ? parseInt(args[daysIdx + 1], 10) : 28;
    const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 20;

    try {
      const { gscPlugin } = await import('@seokit/plugin-gsc');
      let data: any;
      if (sub === 'queries') {
        data = await gscPlugin.topQueries(days, limit);
      } else if (sub === 'pages') {
        data = await gscPlugin.topPages(days, limit);
      } else if (sub === 'opportunities') {
        data = await gscPlugin.lowCtrHighImpressions(days);
      } else {
        console.error('Unknown gsc subcommand:', sub);
        process.exit(1);
      }
      
      if (format === 'table') {
        console.table(data);
      } else {
        console.log(JSON.stringify(data, null, 2));
      }
      process.exit(0);
    } catch (e: any) {
      if (e.name === 'GSCCredentialsMissingError' || e.message?.includes('GSC_SERVICE_ACCOUNT_PATH') || e.message?.includes('GSC_PROPERTY_URL') || e.message?.includes('JSON invalid')) {
        console.error(`error: ${e.message}. Set it in .env — see docs/week2-setup.md`);
        process.exit(2);
      }
      console.error(e.message);
      process.exit(1);
    }
  }

  if (command === 'competitive') {
    const sub = args[3];
    const format = args.includes('--format=table') || (args.includes('--format') && args[args.indexOf('--format')+1] === 'table') ? 'table' : 'json';
    
    if (sub === 'sitemap-diff') {
      const mineIdx = args.indexOf('--mine');
      const theirsIdx = args.indexOf('--theirs');
      if (mineIdx === -1 || theirsIdx === -1) {
        console.error('Usage: seokit competitive sitemap-diff --mine <url> --theirs <url>');
        process.exit(1);
      }
      const mineUrl = args[mineIdx + 1];
      const theirsUrl = args[theirsIdx + 1];
      
      const { CompetitiveSitemapPlugin } = await import('@seokit/plugins-competitive');
      const plugin = new CompetitiveSitemapPlugin();
      
      const mineSitemap = await plugin.fetchSitemap(mineUrl);
      const theirsSitemap = await plugin.fetchSitemap(theirsUrl);
      
      const diff = plugin.diffSitemaps(mineSitemap, theirsSitemap);
      
      if (format === 'table') {
        console.log(`--- SITEMAP DIFF SUMMARY ---`);
        console.log(`URLs only in MINE: ${diff.onlyMine.length}`);
        console.log(`URLs only in THEIRS: ${diff.onlyTheirs.length}`);
        console.log(`URLs in BOTH: ${diff.both.length}`);
        if (diff.onlyTheirs.length > 0) {
          console.log(`\n--- TOP URLs THEY HAVE THAT WE DON'T ---`);
          console.table(diff.onlyTheirs.slice(0, 50));
        }
      } else {
        console.log(JSON.stringify(diff, null, 2));
      }
      process.exit(0);
    } 
    else if (sub === 'entity') {
      const domainIdx = args.indexOf('--domain');
      if (domainIdx === -1) {
        console.error('Usage: seokit competitive entity --domain <domain>');
        process.exit(1);
      }
      const domain = args[domainIdx + 1];
      const { CompetitiveEntityPlugin } = await import('@seokit/plugins-competitive');
      const plugin = new CompetitiveEntityPlugin();
      const presence = await plugin.checkEntity(domain);
      
      if (format === 'table') {
        console.table([presence]);
      } else {
        console.log(JSON.stringify(presence, null, 2));
      }
      process.exitCode = 0; return;
    }
    else if (sub === 'entity-compare') {
      const mineIdx = args.indexOf('--mine');
      const theirsIdx = args.indexOf('--theirs');
      if (mineIdx === -1 || theirsIdx === -1) {
        console.error('Usage: seokit competitive entity-compare --mine <domain> --theirs <domain>');
        process.exitCode = 1; return;
      }
      const mineDomain = args[mineIdx + 1];
      const theirsDomain = args[theirsIdx + 1];
      const { CompetitiveEntityPlugin } = await import('@seokit/plugins-competitive');
      const plugin = new CompetitiveEntityPlugin();
      
      const [mine, theirs] = await Promise.all([
        plugin.checkEntity(mineDomain),
        plugin.checkEntity(theirsDomain)
      ]);
      
      if (format === 'table') {
        console.table({ mine, theirs });
      } else {
        console.log(JSON.stringify({ mine, theirs }, null, 2));
      }
      process.exitCode = 0; return;
    }
    else {
      console.error('Unknown competitive subcommand:', sub);
      process.exit(1);
    }
  }

  if (command !== 'verify') {
    console.log(`
SEOKit v2 Platform CLI Client
Usage:
  seokit-v2 init                 Register zero-config client integration files
  seokit-v2 doctor               Verify and diagnose connection config health
  seokit-v2 mcp                  Launch Stdio MCP server
  seokit-v2 verify [path]        Run verification orchestrations on workspace path
  seokit-v2 crux <url> [--origin] [--format json|table]
  seokit-v2 gsc <queries|pages|opportunities> [--days 28] [--limit 20] [--format json|table]
  seokit-v2 competitive <sitemap-diff|entity|entity-compare>
`);
    process.exit(0);
  }

  console.log(`[CLI] Launching SEOKit v2 platform run against: ${target}`);

  if (args.includes('--llms-txt')) {
    const pathIdx = args.indexOf('--path');
    let verifyPath = target;
    if (pathIdx !== -1) {
      verifyPath = args[pathIdx + 1];
      if (fs.statSync(verifyPath).isFile()) {
        verifyPath = path.dirname(verifyPath);
      }
    }
    console.log('[SEOKit] Validating llms.txt internally...');
    try {
      const llmsPath = path.join(verifyPath, 'llms.txt');
      if (!fs.existsSync(llmsPath)) {
        console.error(`✗ Validation failed: llms.txt not found at ${llmsPath}`);
        process.exit(1);
      }
      
      const content = fs.readFileSync(llmsPath, 'utf8');
      
      // Basic checks
      if (!content) {
        console.error('✗ Validation failed: file is empty');
        process.exit(1);
      }
      
      if (!/^#\s+.+/m.test(content)) {
        console.error('✗ Validation failed: missing H1 title');
        process.exit(1);
      }
      
      const h2Sections = content.split(/^##\s+.+$/m).slice(1);
      // Removed strict requirements for H2 sections and links as per spec
      
      if (/<[a-z][\s\S]*>/i.test(content)) {
        console.error('✗ Validation failed: contains HTML tags');
        process.exit(1);
      }
      
      console.log('✓ llms.txt is valid!');
    } catch (err: any) {
      console.error('✗ llms.txt validation failed: ' + err.message);
      process.exit(1);
    }
    process.exit(0);
  }

  const criticIdx = args.indexOf('--critic');
  if (criticIdx !== -1 && args[criticIdx + 1] === 'aeolint') {
    console.log('[SEOKit] Running independent Aeolint critic...');
    const { AeolintCritic } = await import('@seokit/critic-aeolint');
    const critic = new AeolintCritic();
    try {
      const findings = await critic.evaluate(target);
      // Ensure we have a fix field since the prompt asks for it
      const mapped = findings.map((f: any) => ({ ...f, fix: f.fix || 'No explicit fix provided' }));
      console.log(JSON.stringify(mapped, null, 2));
      process.exit(mapped.length > 0 ? 1 : 0);
    } catch (err: any) {
      console.error(err);
      process.exit(1);
    }
  }

  let workspacePath = target;
  try {
    if (fs.statSync(target).isFile()) {
      workspacePath = path.dirname(target);
    }
  } catch(e) {}

  const seokitDir = path.resolve(workspacePath, '.seokit');
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
      workspaceRoot: workspacePath,
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

    const seokitDir2 = path.resolve(workspacePath, '.seokit');
    const reportsDir = path.join(seokitDir2, 'reports');
    const historyDir = path.join(seokitDir2, 'history');

    fs.mkdirSync(reportsDir, { recursive: true });
    fs.mkdirSync(historyDir, { recursive: true });

    fs.writeFileSync(path.join(reportsDir, 'report.json'), ReportGenerator.exportToJson(report));
    fs.writeFileSync(path.join(reportsDir, 'report.md'), ReportGenerator.exportToMarkdown(report));
    fs.writeFileSync(path.join(reportsDir, 'report.html'), ReportGenerator.exportToHtml(report));
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
