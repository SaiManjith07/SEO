import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const monorepoRoot = path.resolve(__dirname, '../../..');
const coreDir = path.resolve(monorepoRoot, 'packages/core');

async function main() {
  console.log('--- Starting Production Packaging Test ---');
  
  // 1. Pack @seokit/core inside packages/core
  console.log('Packing @seokit/core...');
  execSync('pnpm pack', { cwd: coreDir, stdio: 'inherit' });
  
  // Locate the packed tgz file
  const files = fs.readdirSync(coreDir);
  const tgzFile = files.find(f => f.startsWith('seokit-core-') && f.endsWith('.tgz'));
  if (!tgzFile) {
    throw new Error('Could not find packed tgz file in packages/core');
  }
  const tgzPath = path.resolve(coreDir, tgzFile);
  console.log(`Packed archive created: ${tgzPath}`);

  // 2. Setup temp directory outside monorepo
  const tempDir = path.join(os.tmpdir(), `seokit-pack-test-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });
  console.log(`Created temporary external sandbox at: ${tempDir}`);

  try {
    // Write package.json indicating ESM
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ name: 'external-sample-project', type: 'module' }, null, 2),
      'utf-8'
    );

    // 3. Install core tgz and local plugins to simulate external environment resolution
    const pluginsToInstall = [
      path.resolve(monorepoRoot, 'packages/plugins/seo'),
      path.resolve(monorepoRoot, 'packages/plugins/performance'),
      path.resolve(monorepoRoot, 'packages/plugins/accessibility'),
      path.resolve(monorepoRoot, 'packages/plugins/aeo'),
      path.resolve(monorepoRoot, 'packages/plugins/geo')
    ];

    console.log('Installing seokit-core and workspace plugins in temporary project...');
    const installCmd = `npm install --no-audit --no-fund "${tgzPath}" ${pluginsToInstall.map(p => `"${p}"`).join(' ')}`;
    execSync(installCmd, { cwd: tempDir, stdio: 'inherit' });

    // Path to the installed CLI binary executable
    const cliPath = path.join(tempDir, 'node_modules', '@seokit', 'core', 'dist', 'cli.js');
    if (!fs.existsSync(cliPath)) {
      throw new Error(`CLI executable not found at: ${cliPath}`);
    }

    // 4. Run CLI commands sequentially in the external sandbox
    console.log('\nRunning: seokit init...');
    execSync(`node "${cliPath}" init`, { cwd: tempDir, stdio: 'inherit' });

    const configPath = path.join(tempDir, '.seokit', 'config.json');
    if (!fs.existsSync(configPath)) {
      throw new Error('Config file config.json not created by init');
    }
    console.log('✓ config.json verified.');

    // Write a mock HTML project page
    const mockHtml = `
      <html>
        <head>
          <!-- Missing canonical, missing title, missing description -->
        </head>
        <body>
          <h1>External Project Verification</h1>
          <form>
            <input type="text" id="username" /> <!-- Missing label -->
          </form>
        </body>
      </html>
    `;
    fs.writeFileSync(path.join(tempDir, 'index.html'), mockHtml, 'utf-8');

    console.log('\nRunning: seokit verify...');
    execSync(`node "${cliPath}" verify`, { cwd: tempDir, stdio: 'inherit' });

    const evidenceDir = path.join(tempDir, '.seokit', 'evidence');
    if (!fs.existsSync(evidenceDir) || fs.readdirSync(evidenceDir).length === 0) {
      throw new Error('No compliance evidence saved under .seokit/evidence/');
    }
    console.log('✓ Evidence records generated.');

    // Read taskId from evidence filename or content
    const evidenceFiles = fs.readdirSync(evidenceDir);
    const sampleEvidence = JSON.parse(fs.readFileSync(path.join(evidenceDir, evidenceFiles[0]), 'utf-8'));
    const taskId = sampleEvidence.taskId;
    console.log(`Located E2E Task ID: ${taskId}`);

    console.log('\nRunning: seokit report...');
    execSync(`node "${cliPath}" report "${taskId}" html`, { cwd: tempDir, stdio: 'inherit' });

    const reportFile = path.join(tempDir, '.seokit', 'reports', `report_${taskId}.html`);
    if (!fs.existsSync(reportFile) || fs.readFileSync(reportFile, 'utf-8').length === 0) {
      throw new Error('Report file was not generated or is empty');
    }
    console.log('✓ HTML Dashboard report generated successfully.');

    console.log('\nRunning: seokit fix...');
    execSync(`node "${cliPath}" fix "${taskId}"`, { cwd: tempDir, stdio: 'inherit' });
    console.log('✓ Fix plan trace validation passed.');

    console.log('\n--- Production Packaging Test Passed Successfully! ---');
  } finally {
    // Cleanup temporary workspace
    console.log('Cleaning up sandbox...');
    fs.rmSync(tempDir, { recursive: true, force: true });
    // Remove packed tgz file
    fs.unlinkSync(tgzPath);
  }
}

main().catch(err => {
  console.error('\n❌ Production Packaging Test Failed:', err);
  process.exit(1);
});
