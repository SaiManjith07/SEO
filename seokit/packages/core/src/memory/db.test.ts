import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  saveProject,
  loadProject,
  saveDecision,
  loadDecisions,
  saveFixOutcome,
  loadFixOutcomes,
  saveCrawl,
  loadCrawlHistory,
} from './db.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('JSON flat-file project memory storage tests', () => {
  let tempDir: string;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'seokit-json-test-'));
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should successfully save and load project definition to JSON', () => {
    const projectId = saveProject(tempDir, 'https://mysite.com', 'next', 'custom rules');
    expect(projectId).toBe(1);

    const projectFile = path.join(tempDir, '.seokit', 'project.json');
    expect(fs.existsSync(projectFile)).toBe(true);

    const project = loadProject(tempDir);
    expect(project).not.toBeNull();
    expect(project?.root).toBe(tempDir);
    expect(project?.siteUrl).toBe('https://mysite.com');
    expect(project?.framework).toBe('next');
    expect(project?.conventions).toBe('custom rules');
  });

  it('should save and load override decisions to JSON', () => {
    const projectId = saveProject(tempDir);
    const decisionId = saveDecision(
      tempDir,
      projectId,
      'STD-09',
      'ignore warning',
      'Legal copy approval requires no FAQ schemas'
    );
    expect(decisionId).toBe(1);

    const decisionFile = path.join(tempDir, '.seokit', 'decisions.json');
    expect(fs.existsSync(decisionFile)).toBe(true);

    const decisions = loadDecisions(tempDir, projectId);
    expect(decisions.length).toBe(1);
    expect(decisions[0].ruleId).toBe('STD-09');
    expect(decisions[0].decision).toBe('ignore warning');
    expect(decisions[0].rationale).toBe('Legal copy approval requires no FAQ schemas');
  });

  it('should save and load crawl histories to JSON', () => {
    const projectId = saveProject(tempDir);
    const crawlId = saveCrawl(tempDir, projectId, 92, 5, 0, 3);
    expect(crawlId).toBe(1);

    const crawlsFile = path.join(tempDir, '.seokit', 'crawls.json');
    expect(fs.existsSync(crawlsFile)).toBe(true);

    const history = loadCrawlHistory(tempDir, projectId);
    expect(history.length).toBe(1);
    expect(history[0].score).toBe(92);
    expect(history[0].pagesCrawled).toBe(5);
    expect(history[0].errorsCount).toBe(0);
    expect(history[0].warningsCount).toBe(3);
  });
});
