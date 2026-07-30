import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PlannerAgent } from './agents/planner.js';
import { KnowledgeAgent } from './agents/knowledge.js';
import { ResearchAgent } from './agents/research.js';
import { VerificationAgent } from './agents/verification.js';
import { AgentOrchestrator } from './loop.js';
import { Task, Context } from './agent.js';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { FileStorageProvider } from '@seokit/core';

describe('orchestrator agents workflow tests', () => {
  let server: http.Server;
  let port: number;

  beforeAll(() => {
    server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <title>SEOKit Policy Testing Page</title>
          <meta name="description" content="A valid meta description for testing the performance policy engine.">
          <link rel="canonical" href="http://localhost:${port}/">
        </head>
        <body>
          <h1>SEO Optimized Header</h1>
          <img src="/image.png" alt="Test Image" width="200" height="100" loading="lazy">
        </body>
        </html>
      `);
    });
    server.listen(0);
    const addr = server.address();
    port = typeof addr === 'string' ? 0 : addr?.port || 0;
  });

  afterAll(() => {
    server.close();
  });

  it('should generate a detailed phase plan for SEO tasks', async () => {
    const planner = new PlannerAgent();
    const task: Task = {
      id: 'task_seo_test',
      type: 'plan',
      goal: 'Optimize Next.js SEO metadata and indexability settings',
      context: {},
      maxLoops: 5,
      successCriteria: ['Completed standard indexability optimization'],
    };
    const context: Context = {
      projectId: 'p-1',
      workingDir: process.cwd(),
      messages: [],
      memory: {},
      storage: new FileStorageProvider(process.cwd()),
    };

    const result = await planner.run(task, context);
    expect(result.success).toBe(true);
    expect(result.output).toBeDefined();

    const planTasks = JSON.parse(result.output!);
    expect(planTasks.length).toBe(5);
    expect(planTasks[0].type).toBe('inspect');
    expect(planTasks[1].type).toBe('knowledge');
    expect(planTasks[2].type).toBe('coding');
  });

  it('should return rules when queries match standards filenames', async () => {
    const kb = new KnowledgeAgent();
    const task: Task = {
      id: 'task_kb_test',
      type: 'knowledge',
      goal: 'Load schema markup rules',
      context: {},
      maxLoops: 1,
      successCriteria: ['Metadata loaded'],
    };
    const context: Context = {
      projectId: 'p-2',
      workingDir: process.cwd(),
      messages: [],
      memory: {},
      storage: new FileStorageProvider(process.cwd()),
    };

    const result = await kb.run(task, context);
    expect(result.success).toBe(true);
    expect(result.output).toBeDefined();
  });

  it('should run a complete mock orchestrator execution successfully', async () => {
    const orchestrator = new AgentOrchestrator();
    const { success, logs } = await orchestrator.runOrchestration(`Optimize mock site profile at http://localhost:${port}/`, process.cwd(), 2);
    expect(success).toBe(true);
    expect(logs.length).toBeGreaterThanOrEqual(2);
    expect(logs[0].agentName).toBe('Planner');
  });

  it('should find matching research lines in local files', async () => {
    const research = new ResearchAgent();
    const task: Task = {
      id: 'task_res',
      type: 'research',
      goal: 'Research Core Web Vitals INP metric performance rules',
      context: {},
      maxLoops: 1,
      successCriteria: [],
    };
    const context: Context = {
      projectId: 'p-res',
      workingDir: process.cwd(),
      messages: [],
      memory: {},
      storage: new FileStorageProvider(process.cwd()),
    };

    const result = await research.run(task, context);
    expect(result.success).toBe(true);
    expect(result.findings.some(f => f.includes('Found relevant info') || f.includes('Using default'))).toBe(true);
    expect(result.output).toContain('INP');
  });

  it('should verify live mock HTML using VerificationAgent', async () => {
    const verification = new VerificationAgent();
    const task: Task = {
      id: 'task_ver',
      type: 'verify',
      goal: `Verify page http://localhost:${port}/ indexability`,
      context: { url: `http://localhost:${port}/` },
      maxLoops: 1,
      successCriteria: [],
    };
    const context: Context = {
      projectId: 'p-ver',
      workingDir: process.cwd(),
      messages: [],
      memory: {},
      storage: new FileStorageProvider(process.cwd()),
    };

    const result = await verification.run(task, context);
    expect(result.success).toBe(true);
    expect(result.findings.some(f => f.includes('Policy evaluation passed'))).toBe(true);
  });

  it('should fail policy verification when canonical is relative', async () => {
    let failServer = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
        <head>
          <title>Lacking Canonical</title>
          <meta name="description" content="Valid description.">
          <link rel="canonical" href="/relative-path">
        </head>
        <body></body>
        </html>
      `);
    });
    failServer.listen(0);
    const failAddr = failServer.address();
    const failPort = typeof failAddr === 'string' ? 0 : failAddr?.port || 0;

    const verification = new VerificationAgent();
    const task: Task = {
      id: 'task_ver_fail',
      type: 'verify',
      goal: `Verify page http://localhost:${failPort}/ indexability`,
      context: { url: `http://localhost:${failPort}/` },
      maxLoops: 1,
      successCriteria: [],
    };
    const context: Context = {
      projectId: 'p-ver-fail',
      workingDir: process.cwd(),
      messages: [],
      memory: {},
      storage: new FileStorageProvider(process.cwd()),
    };

    try {
      const result = await verification.run(task, context);
      expect(result.success).toBe(false);
      expect(result.findings.some(f => f.includes('canonical-validator'))).toBe(true);
    } finally {
      failServer.close();
    }
  });

  it('should step back to coding agent when critic agent fails', async () => {
    const orchestrator = new AgentOrchestrator();

    let codingRuns = 0;
    (orchestrator as any).agents.coding = {
      name: 'Coding',
      run: async (task: Task, context: Context) => {
        codingRuns++;
        return { success: true, findings: ['Mock coding run successful'], patchApplied: 'some-patch' };
      }
    };

    let criticRuns = 0;
    (orchestrator as any).agents.critic = {
      name: 'Critic',
      run: async (task: Task, context: Context) => {
        criticRuns++;
        if (criticRuns === 1) {
          return { success: false, findings: ['Mock critic violation'], error: 'Empty alt attribute detected' };
        }
        return { success: true, findings: ['Mock critic passed'] };
      }
    };

    (orchestrator as any).agents.verify = {
      name: 'Verification',
      run: async (task: Task, context: Context) => {
        return { success: true, findings: ['Mock verification passed'] };
      }
    };

    const { success, logs } = await orchestrator.runOrchestration('Optimize mock site profile', process.cwd(), 2);
    expect(success).toBe(true);
    expect(codingRuns).toBe(2);
    expect(criticRuns).toBe(2);
    expect(logs.some(l => l.findings.some(f => f.includes('Routing back to Coding agent')))).toBe(true);
  });

  it('should save and retrieve tasks and evidence through FileStorageProvider with deterministic hashes', () => {
    const { FileStorageProvider, hashString } = require('@seokit/core');
    const storage = new FileStorageProvider(process.cwd());

    const testTaskId = 'task_storage_test_123';
    const hashedTaskId = hashString(testTaskId);

    const taskRecord = {
      id: testTaskId,
      capabilityId: 'seo.test',
      status: 'COMPLETED' as const,
      targetFiles: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      requiredEvidenceIds: []
    };

    storage.tasks.saveTask(taskRecord);

    const expectedTaskPath = path.join(process.cwd(), '.seokit', 'tasks', `task_${hashedTaskId}.json`);
    expect(fs.existsSync(expectedTaskPath)).toBe(true);

    const loadedTask = storage.tasks.getTask(testTaskId);
    expect(loadedTask).not.toBeNull();
    expect(loadedTask?.capabilityId).toBe('seo.test');

    const evidenceRecord = {
      id: 'ev_123',
      schemaVersion: 1,
      taskId: testTaskId,
      executionId: 'exec_123',
      capabilityId: 'seo.test',
      ruleId: 'rule_123',
      treeHash: 'tree_123',
      ruleVersion: '1.0.0',
      validatorVersion: '1.0.0',
      capabilityVersion: '1.0.0',
      frameworkSdkVersion: '1.0.0',
      passed: true,
      output: 'Storage check passed',
      timestamp: new Date().toISOString()
    };

    storage.evidence.saveEvidence(evidenceRecord);

    const hashKey = `${evidenceRecord.treeHash}_${evidenceRecord.ruleId}_${evidenceRecord.taskId}_${evidenceRecord.ruleVersion}_${evidenceRecord.validatorVersion}_${evidenceRecord.capabilityVersion}_${evidenceRecord.frameworkSdkVersion}`;
    const expectedEvidencePath = path.join(process.cwd(), '.seokit', 'evidence', `${hashString(hashKey)}.json`);
    expect(fs.existsSync(expectedEvidencePath)).toBe(true);

    const loadedEvidence = storage.evidence.getEvidence(evidenceRecord.id);
    expect(loadedEvidence).not.toBeNull();
    expect(loadedEvidence?.output).toBe('Storage check passed');
  });

  it('should successfully log and list run executions via HistoryStore', () => {
    const { FileStorageProvider } = require('@seokit/core');
    const storage = new FileStorageProvider(process.cwd());

    const timestamp = new Date().toISOString();
    const runRecord = {
      success: true,
      score: 1.0,
      errorsCount: 0,
      warningsCount: 0
    };

    storage.history.saveHistory(timestamp, runRecord);

    const list = storage.history.listHistory();
    expect(list.length).toBeGreaterThan(0);
    expect(list.some((r: any) => r.score === 1.0)).toBe(true);
  });

});
