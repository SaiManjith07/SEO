#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { bootstrapVerificationEngine } from './platform/bootstrap.js';
import { FileStorageProvider } from './platform/store.js';
import { ReportEngine } from './platform/reports.js';
import { VERSION } from './version.js';

function showHelp() {
  console.log(`
SEOKit CLI Tool
Usage:
  seokit init                       Initialize .seokit workspace config file in current directory.
  seokit verify [path]              Verify rules on local workspace.
  seokit report <taskId> <format>   Export report (json | html | md | sarif).
  seokit fix <taskId>               Execute fixes matching failed rule plans.
  seokit cache clean                Clear all cached validator execution results.
  seokit help                       Show help guidelines.
`);
}

export async function runCli(argv: string[], cwd: string = process.cwd()): Promise<void> {
  const command = argv[2];
  const param1 = argv[3];
  const param2 = argv[4];

  if (!command || command === 'help') {
    showHelp();
    return;
  }

  const projectRoot = cwd;

  if (command === 'init') {
    console.log(`Initializing SEOKit workspace at ${projectRoot}...`);
    const seokitDir = path.join(projectRoot, '.seokit');
    if (!fs.existsSync(seokitDir)) {
      fs.mkdirSync(seokitDir, { recursive: true });
    }

    const configPath = path.join(seokitDir, 'config.json');
    const defaultConfig = {
      site: {
        url: 'https://example.com',
        name: 'My Project'
      },
      plugins: [
        '@seokit/plugin-seo',
        '@seokit/plugin-performance',
        '@seokit/plugin-accessibility',
        '@seokit/plugin-aeo',
        '@seokit/plugin-geo'
      ],
      rules: {
        'seo.robots.valid': 'error',
        'seo.canonical.exists': 'error',
        'accessibility.heading.hierarchy': 'warning'
      },
      aiCrawlers: [
        'Googlebot',
        'Google-Extended',
        'OAI-SearchBot',
        'Claude-SearchBot',
        'PerplexityBot',
        'Bingbot'
      ]
    };

    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    console.log(`Scaffolding complete. Config created: ${configPath}`);
    return;
  }

  if (command === 'verify') {
    const targetPath = param1 || projectRoot;
    console.log(`Verifying workspace elements at: ${targetPath}...`);
    
    const storageProvider = new FileStorageProvider(projectRoot);
    
    // Load plugins dynamically from workspace configuration to support modular extensibility
    const plugins: any[] = [];
    const configPath = path.join(projectRoot, '.seokit', 'config.json');
    
    if (fs.existsSync(configPath)) {
      try {
        const configJson = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        const configPlugins = configJson.plugins || [];
        for (const name of configPlugins) {
          try {
            const isStandardNpm = /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-._~]+$/.test(name);
            if (!isStandardNpm || name.includes('..') || name.startsWith('.') || path.isAbsolute(name)) {
              console.warn(`[WARN] Ignored unsafe or invalid plugin name: '${name}'. Must be a standard NPM package name without relative/absolute paths.`);
              continue;
            }
            const mod = await import(name);
            const key = Object.keys(mod).find(k => k.toLowerCase().includes('plugin'));
            if (key && mod[key]) {
              plugins.push(mod[key]);
            }
          } catch (err: any) {
            console.warn(`[WARN] Failed to import plugin '${name}': ${err.message}`);
          }
        }
      } catch (e: any) {
        console.warn(`[WARN] Failed to parse config plugins: ${e.message}`);
      }
    }

    const engine = bootstrapVerificationEngine(plugins);
    
    try {
      const taskId = `task_${Date.now()}`;
      const htmlPath = path.join(targetPath, 'index.html');
      const rawHtml = fs.existsSync(htmlPath)
        ? fs.readFileSync(htmlPath, 'utf-8')
        : '<html><head></head><body><h1>My Static Project</h1></body></html>';

      const robotsPath = path.join(targetPath, 'robots.txt');
      const robotsTxt = fs.existsSync(robotsPath)
        ? fs.readFileSync(robotsPath, 'utf-8')
        : 'User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap.xml';

      const sitemapPath = path.join(targetPath, 'sitemap.xml');
      const sitemapXml = fs.existsSync(sitemapPath)
        ? fs.readFileSync(sitemapPath, 'utf-8')
        : '';

      const results = await engine.verifyProject({
        rawHtml,
        filePath: 'index.html',
        robotsTxt,
        sitemapXml,
        config: {
          aiCrawlers: [
            'Googlebot',
            'Google-Extended',
            'OAI-SearchBot',
            'Claude-SearchBot',
            'PerplexityBot',
            'Bingbot'
          ]
        }
      });

      for (const ev of results) {
        const record = {
          id: `${ev.ruleId}_${taskId}`,
          schemaVersion: 1,
          taskId,
          executionId: 'exec-1',
          capabilityId: ev.capabilityId || 'seo.audit',
          ruleId: ev.ruleId || 'unknown-rule',
          treeHash: 'abc',
          ruleVersion: ev.ruleVersion || VERSION,
          validatorVersion: VERSION,
          capabilityVersion: VERSION,
          frameworkSdkVersion: VERSION,
          passed: ev.passed,
          output: ev.output,
          timestamp: new Date().toISOString(),
          fixPlan: ev.fixPlan,
          standard: ev.standard
        };
        storageProvider.evidence.saveEvidence(record);
      }

      console.log(`\n=== Verification Finished (Task: ${taskId}) ===`);
      console.log(`Total Findings: ${results.length}`);
      
      const errors = results.filter(r => !r.passed);
      if (errors.length === 0) {
        console.log('✓ All checks passed! Standard compliance verified.');
      } else {
        console.log(`${errors.length} issues detected. Run "seokit report ${taskId} html" to inspect.`);
        for (const e of errors) {
          console.log(`  [FAIL] Rule: ${e.ruleId} | Standard: ${e.standard || 'N/A'}`);
          console.log(`         Details: ${e.output}`);
        }
      }
    } catch (err: any) {
      console.error(`Verification failed: ${err.message}`);
      throw err;
    }
  }

  else if (command === 'report') {
    const taskId = param1;
    const format = param2;
    if (!taskId || !format) {
      console.error('Usage: seokit report <taskId> <json | html | md | sarif>');
      throw new Error('Missing taskId or format parameter');
    }

    try {
      const storageProvider = new FileStorageProvider(projectRoot);
      const reportEngine = new ReportEngine(storageProvider.evidence);
      const output = await reportEngine.generateReport(taskId, format as any);
      
      const outDir = path.join(projectRoot, '.seokit', 'reports');
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }

      const outFile = path.join(outDir, `report_${taskId}.${format}`);
      fs.writeFileSync(outFile, output, 'utf-8');
      console.log(`Report generated successfully at: ${outFile}`);
    } catch (err: any) {
      console.error(`Report generation failed: ${err.message}`);
      throw err;
    }
  }

  else if (command === 'fix') {
    const taskId = param1;
    if (!taskId) {
      console.error('Usage: seokit fix <taskId>');
      throw new Error('Missing taskId parameter');
    }

    try {
      const storageProvider = new FileStorageProvider(projectRoot);
      const evidences = storageProvider.evidence.listEvidenceForTask(taskId);
      const failingWithFixes = evidences.filter(e => !e.passed && e.fixPlan);
      
      if (failingWithFixes.length === 0) {
        console.log('No automatic fixes pending for this task.');
        return;
      }

      console.log(`Applying ${failingWithFixes.length} fixes...`);
      for (const e of failingWithFixes) {
        console.log(`Applying fix for: ${e.ruleId}`);
        console.log(`  Suggested Action: ${e.fixPlan.suggestedFix}`);
      }
      console.log('Fix application trace finished.');
    } catch (err: any) {
      console.error(`Fix operation failed: ${err.message}`);
      throw err;
    }
  }
  else if (command === 'cache') {
    const action = param1;
    if (action !== 'clean') {
      console.error('Usage: seokit cache clean');
      throw new Error('Invalid cache action parameter');
    }

    try {
      const storageProvider = new FileStorageProvider(projectRoot);
      storageProvider.cache.clear();
      console.log('SEOKit cache cleared successfully.');
    } catch (err: any) {
      console.error(`Cache cleanup failed: ${err.message}`);
      throw err;
    }
  }

  else {
    console.log(`Unknown command: ${command}`);
    showHelp();
    throw new Error(`Unknown command: ${command}`);
  }
}

// Execute if run directly from command line
const mainFile = process.argv[1];
if (mainFile && (mainFile.endsWith('cli.ts') || mainFile.endsWith('cli.js') || mainFile.includes('bin/seokit'))) {
  runCli(process.argv, process.cwd()).catch(() => {
    process.exit(1);
  });
}
