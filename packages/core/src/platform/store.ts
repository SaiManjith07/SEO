import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface EvidenceRecord {
  id: string;
  schemaVersion: number;
  taskId: string;
  executionId: string;
  capabilityId: string;
  ruleId: string;
  treeHash: string;
  ruleVersion: string;
  validatorVersion: string;
  capabilityVersion: string;
  frameworkSdkVersion: string;
  passed: boolean;
  output: string;
  timestamp: string;
  fixPlan?: any;
  standard?: string;
}

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'VERIFYING' | 'COMPLETED' | 'FAILED';

export interface TaskRecord {
  id: string;
  capabilityId: string;
  status: TaskStatus;
  targetFiles: string[];
  createdAt: string;
  updatedAt: string;
  requiredEvidenceIds: string[];
}

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

export function hashString(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex').substring(0, 16);
}

// Interfaces
export interface TaskStore {
  saveTask(task: TaskRecord): void;
  getTask(id: string): TaskRecord | null;
  listTasks(): TaskRecord[];
}

export interface EvidenceStore {
  saveEvidence(evidence: EvidenceRecord): void;
  getEvidence(id: string): EvidenceRecord | null;
  listEvidenceForTask(taskId: string): EvidenceRecord[];
}

export interface CacheStore {
  set(key: string, value: any): void;
  get<T>(key: string): T | null;
  clear(): void;
}

export interface ReportStore {
  saveReport(fileName: string, content: string): void;
  getReport(fileName: string): string | null;
}

export interface HistoryStore {
  saveHistory(timestamp: string, runRecord: any): void;
  getHistory(timestamp: string): any | null;
  listHistory(): any[];
}

export interface StorageProvider {
  tasks: TaskStore;
  evidence: EvidenceStore;
  cache: CacheStore;
  reports: ReportStore;
  history: HistoryStore;
}

// File Implementations
export class FileTaskStore implements TaskStore {
  private dirPath: string;

  constructor(projectRoot: string) {
    this.dirPath = path.join(projectRoot, '.seokit', 'tasks');
    if (!fs.existsSync(this.dirPath)) {
      fs.mkdirSync(this.dirPath, { recursive: true });
    }
  }

  public saveTask(task: TaskRecord): void {
    const filename = `task_${hashString(task.id)}.json`;
    const filePath = path.join(this.dirPath, filename);
    writeJsonFile(filePath, task);
  }

  public getTask(id: string): TaskRecord | null {
    const filename = `task_${hashString(id)}.json`;
    const filePath = path.join(this.dirPath, filename);
    if (!fs.existsSync(filePath)) return null;
    return readJsonFile<TaskRecord>(filePath, null as any);
  }

  public listTasks(): TaskRecord[] {
    if (!fs.existsSync(this.dirPath)) return [];
    const files = fs.readdirSync(this.dirPath);
    const list: TaskRecord[] = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const record = readJsonFile<TaskRecord>(path.join(this.dirPath, file), null as any);
        if (record) {
          list.push(record);
        }
      }
    }
    return list;
  }
}

export class FileEvidenceStore implements EvidenceStore {
  private dirPath: string;

  constructor(projectRoot: string) {
    this.dirPath = path.join(projectRoot, '.seokit', 'evidence');
    if (!fs.existsSync(this.dirPath)) {
      fs.mkdirSync(this.dirPath, { recursive: true });
    }
  }

  public saveEvidence(evidence: EvidenceRecord): void {
    const hashKey = `${evidence.treeHash}_${evidence.ruleId}_${evidence.taskId}_${evidence.ruleVersion}_${evidence.validatorVersion}_${evidence.capabilityVersion}_${evidence.frameworkSdkVersion}`;
    const filename = `${hashString(hashKey)}.json`;
    const filePath = path.join(this.dirPath, filename);
    writeJsonFile(filePath, evidence);
  }

  public getEvidence(id: string): EvidenceRecord | null {
    const filePath = path.join(this.dirPath, id.endsWith('.json') ? id : `${id}.json`);
    if (fs.existsSync(filePath)) {
      return readJsonFile<EvidenceRecord>(filePath, null as any);
    }
    const files = fs.readdirSync(this.dirPath);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const record = readJsonFile<EvidenceRecord>(path.join(this.dirPath, file), null as any);
        if (record && record.id === id) {
          return record;
        }
      }
    }
    return null;
  }

  public listEvidenceForTask(taskId: string): EvidenceRecord[] {
    if (!fs.existsSync(this.dirPath)) return [];
    const files = fs.readdirSync(this.dirPath);
    const list: EvidenceRecord[] = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const record = readJsonFile<EvidenceRecord>(path.join(this.dirPath, file), null as any);
        if (record && record.taskId === taskId) {
          list.push(record);
        }
      }
    }
    return list;
  }
}

export class FileCacheStore implements CacheStore {
  private dirPath: string;

  constructor(projectRoot: string) {
    this.dirPath = path.join(projectRoot, '.seokit', 'cache');
    if (!fs.existsSync(this.dirPath)) {
      fs.mkdirSync(this.dirPath, { recursive: true });
    }
  }

  public set(key: string, value: any): void {
    const filename = `${hashString(key)}.json`;
    const filePath = path.join(this.dirPath, filename);
    writeJsonFile(filePath, { key, value });
  }

  public get<T>(key: string): T | null {
    const filename = `${hashString(key)}.json`;
    const filePath = path.join(this.dirPath, filename);
    if (!fs.existsSync(filePath)) return null;
    const wrapper = readJsonFile<{ key: string; value: T } | null>(filePath, null);
    return wrapper ? wrapper.value : null;
  }

  public clear(): void {
    if (!fs.existsSync(this.dirPath)) return;
    const files = fs.readdirSync(this.dirPath);
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          fs.unlinkSync(path.join(this.dirPath, file));
        } catch {
          // Ignore delete failures
        }
      }
    }
  }
}

export class FileReportStore implements ReportStore {
  private reportsDir: string;

  constructor(projectRoot: string) {
    this.reportsDir = path.resolve(projectRoot, '.seokit', 'reports');
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  public saveReport(fileName: string, content: string): void {
    const resolvedPath = path.resolve(this.reportsDir, fileName);
    if (!resolvedPath.startsWith(this.reportsDir)) {
      throw new Error(`Path traversal violation: "${fileName}" resolved outside reports directory.`);
    }
    fs.writeFileSync(resolvedPath, content, 'utf-8');
  }

  public getReport(fileName: string): string | null {
    const resolvedPath = path.resolve(this.reportsDir, fileName);
    if (!resolvedPath.startsWith(this.reportsDir)) {
      throw new Error(`Path traversal violation: "${fileName}" resolved outside reports directory.`);
    }
    if (!fs.existsSync(resolvedPath)) return null;
    return fs.readFileSync(resolvedPath, 'utf-8');
  }
}

export class FileHistoryStore implements HistoryStore {
  private dirPath: string;

  constructor(projectRoot: string) {
    this.dirPath = path.join(projectRoot, '.seokit', 'history');
    if (!fs.existsSync(this.dirPath)) {
      fs.mkdirSync(this.dirPath, { recursive: true });
    }
  }

  public saveHistory(timestamp: string, runRecord: any): void {
    const filename = `${timestamp.replace(/[:.]/g, '-')}.json`;
    const filePath = path.join(this.dirPath, filename);
    writeJsonFile(filePath, runRecord);
  }

  public getHistory(timestamp: string): any | null {
    const filename = `${timestamp.replace(/[:.]/g, '-')}.json`;
    const filePath = path.join(this.dirPath, filename);
    if (!fs.existsSync(filePath)) return null;
    return readJsonFile<any>(filePath, null);
  }

  public listHistory(): any[] {
    if (!fs.existsSync(this.dirPath)) return [];
    const files = fs.readdirSync(this.dirPath);
    const list: any[] = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const record = readJsonFile<any>(path.join(this.dirPath, file), null);
        if (record) {
          list.push(record);
        }
      }
    }
    return list;
  }
}

export class FileStorageProvider implements StorageProvider {
  public tasks: TaskStore;
  public evidence: EvidenceStore;
  public cache: CacheStore;
  public reports: ReportStore;
  public history: HistoryStore;

  constructor(projectRoot: string) {
    this.tasks = new FileTaskStore(projectRoot);
    this.evidence = new FileEvidenceStore(projectRoot);
    this.cache = new FileCacheStore(projectRoot);
    this.reports = new FileReportStore(projectRoot);
    this.history = new FileHistoryStore(projectRoot);
    
    // Create runtime lock directory
    const runtimeDir = path.join(projectRoot, '.seokit', 'runtime');
    if (!fs.existsSync(runtimeDir)) {
      fs.mkdirSync(runtimeDir, { recursive: true });
    }
  }
}

// Retain backwards compatibility wrappers
export const TaskStore = FileTaskStore;
export const EvidenceStore = FileEvidenceStore;
