import * as fs from 'fs';
import * as path from 'path';

export interface ProjectRecord {
  id: number;
  root: string;
  siteUrl?: string;
  framework?: string;
  conventions?: string;
  updatedAt: string;
}

export interface DecisionRecord {
  id: number;
  projectId: number;
  ruleId: string;
  decision: string;
  rationale: string;
  createdAt: string;
}

export interface FixOutcomeRecord {
  id: number;
  projectId: number;
  url: string;
  ruleId: string;
  fixSummary: string;
  rewardBefore: number;
  rewardAfter: number;
  predictedGain: number;
  worked: number;
  createdAt: string;
}

export interface CrawlRecord {
  id: number;
  projectId: number;
  score: number;
  pagesCrawled: number;
  errorsCount: number;
  warningsCount: number;
  createdAt: string;
}

export interface CrawlFindingRecord {
  id: number;
  crawlId: number;
  url: string;
  ruleId: string;
  severity: string;
  message: string;
}

// Helper to ensure .seokit folder exists
function ensureSeokitDir(projectRoot: string): string {
  const dir = path.join(projectRoot, '.seokit');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// Generic file helpers
function readJsonFile<T>(filePath: string, defaultVal: T): T {
  if (!fs.existsSync(filePath)) return defaultVal;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
  } catch {
    return defaultVal;
  }
}

function writeJsonFile<T>(filePath: string, data: T): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// 1. Project Operations
export function saveProject(
  projectRoot: string,
  siteUrl?: string,
  framework?: string,
  conventions?: string
): number {
  const seokitDir = ensureSeokitDir(projectRoot);
  const filePath = path.join(seokitDir, 'project.json');
  
  const existing = readJsonFile<ProjectRecord[]>(filePath, []);
  let record = existing.find(p => p.root === projectRoot);
  const now = new Date().toISOString();

  if (record) {
    record.siteUrl = siteUrl || record.siteUrl;
    record.framework = framework || record.framework;
    record.conventions = conventions || record.conventions;
    record.updatedAt = now;
  } else {
    record = {
      id: existing.length + 1,
      root: projectRoot,
      siteUrl,
      framework,
      conventions,
      updatedAt: now,
    };
    existing.push(record);
  }

  writeJsonFile(filePath, existing);
  return record.id;
}

export function loadProject(projectRoot: string): ProjectRecord | null {
  const seokitDir = ensureSeokitDir(projectRoot);
  const filePath = path.join(seokitDir, 'project.json');
  const existing = readJsonFile<ProjectRecord[]>(filePath, []);
  return existing.find(p => p.root === projectRoot) || null;
}

// 2. Decision Operations
export function saveDecision(
  projectRoot: string,
  projectId: number,
  ruleId: string,
  decision: string,
  rationale: string
): number {
  const seokitDir = ensureSeokitDir(projectRoot);
  const filePath = path.join(seokitDir, 'decisions.json');
  const existing = readJsonFile<DecisionRecord[]>(filePath, []);

  const newId = existing.length + 1;
  const record: DecisionRecord = {
    id: newId,
    projectId,
    ruleId,
    decision,
    rationale,
    createdAt: new Date().toISOString(),
  };

  existing.push(record);
  writeJsonFile(filePath, existing);
  return newId;
}

export function loadDecisions(projectRoot: string, projectId: number): DecisionRecord[] {
  const seokitDir = ensureSeokitDir(projectRoot);
  const filePath = path.join(seokitDir, 'decisions.json');
  const existing = readJsonFile<DecisionRecord[]>(filePath, []);
  return existing
    .filter(d => d.projectId === projectId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// 3. Fix Outcome Operations
export function saveFixOutcome(
  projectRoot: string,
  projectId: number,
  url: string,
  ruleId: string,
  fixSummary: string,
  rewardBefore: number,
  rewardAfter: number,
  predictedGain: number,
  worked: number
): number {
  const seokitDir = ensureSeokitDir(projectRoot);
  const filePath = path.join(seokitDir, 'outcomes.json');
  const existing = readJsonFile<FixOutcomeRecord[]>(filePath, []);

  const newId = existing.length + 1;
  const record: FixOutcomeRecord = {
    id: newId,
    projectId,
    url,
    ruleId,
    fixSummary,
    rewardBefore,
    rewardAfter,
    predictedGain,
    worked,
    createdAt: new Date().toISOString(),
  };

  existing.push(record);
  writeJsonFile(filePath, existing);
  return newId;
}

export function loadFixOutcomes(projectRoot: string, projectId: number): FixOutcomeRecord[] {
  const seokitDir = ensureSeokitDir(projectRoot);
  const filePath = path.join(seokitDir, 'outcomes.json');
  const existing = readJsonFile<FixOutcomeRecord[]>(filePath, []);
  return existing
    .filter(o => o.projectId === projectId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// 4. Crawl Operations
export function saveCrawl(
  projectRoot: string,
  projectId: number,
  score: number,
  pagesCrawled: number,
  errorsCount: number,
  warningsCount: number
): number {
  const seokitDir = ensureSeokitDir(projectRoot);
  const filePath = path.join(seokitDir, 'crawls.json');
  const existing = readJsonFile<CrawlRecord[]>(filePath, []);

  const newId = existing.length + 1;
  const record: CrawlRecord = {
    id: newId,
    projectId,
    score,
    pagesCrawled,
    errorsCount,
    warningsCount,
    createdAt: new Date().toISOString(),
  };

  existing.push(record);
  writeJsonFile(filePath, existing);
  return newId;
}

export function loadCrawlHistory(projectRoot: string, projectId: number): CrawlRecord[] {
  const seokitDir = ensureSeokitDir(projectRoot);
  const filePath = path.join(seokitDir, 'crawls.json');
  const existing = readJsonFile<CrawlRecord[]>(filePath, []);
  return existing
    .filter(c => c.projectId === projectId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// Stubs for API compatibility
export function closeDb(): void {}
export function getDb(): any { return null; }
