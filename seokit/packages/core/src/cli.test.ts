import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { runCli } from './cli.js';

describe('SEOKit CLI End-to-End Integration Flow', () => {
  const tempDir = path.join(process.cwd(), 'temp_cli_e2e_test_dir');

  beforeAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });
  });

  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should execute the full CLI lifecycle cleanly: init -> verify -> report -> fix', async () => {
    // 1. CLI init Command
    await runCli(['node', 'seokit', 'init'], tempDir);
    
    const configPath = path.join(tempDir, '.seokit', 'config.json');
    expect(fs.existsSync(configPath)).toBe(true);
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    expect(config.site.name).toBe('My Project');

    // Write a mock index.html with a known header violation (missing title/description)
    const indexHtml = '<html><head></head><body><h1>E2E Test Site</h1></body></html>';
    fs.writeFileSync(path.join(tempDir, 'index.html'), indexHtml, 'utf-8');

    // 2. CLI verify Command
    await runCli(['node', 'seokit', 'verify'], tempDir);
    
    const evidenceDir = path.join(tempDir, '.seokit', 'evidence');
    expect(fs.existsSync(evidenceDir)).toBe(true);
    const files = fs.readdirSync(evidenceDir);
    expect(files.length).toBeGreaterThan(0);

    // Read the generated taskId from the first evidence file
    const sampleRecord = JSON.parse(fs.readFileSync(path.join(evidenceDir, files[0]), 'utf-8'));
    const taskId = sampleRecord.taskId;
    expect(taskId).toBeDefined();

    // 3. CLI report Commands (HTML, JSON, Markdown, SARIF)
    const formats = ['json', 'html', 'md', 'sarif'];
    for (const fmt of formats) {
      await runCli(['node', 'seokit', 'report', taskId, fmt], tempDir);
      const reportFile = path.join(tempDir, '.seokit', 'reports', `report_${taskId}.${fmt}`);
      expect(fs.existsSync(reportFile)).toBe(true);
      
      const content = fs.readFileSync(reportFile, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
      if (fmt === 'json') {
        const parsed = JSON.parse(content);
        expect(parsed.evidence.length).toBeGreaterThan(0);
      }
    }

    // 4. CLI fix Command
    await runCli(['node', 'seokit', 'fix', taskId], tempDir);
  });
});
