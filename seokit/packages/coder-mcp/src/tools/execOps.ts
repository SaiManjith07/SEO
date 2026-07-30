import { exec } from 'child_process';
import { promisify } from 'util';
import * as fsSync from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

function detectPackageManager(): 'pnpm' | 'yarn' | 'npm' {
  let dir = process.cwd();
  while (true) {
    if (fsSync.existsSync(path.join(dir, 'pnpm-lock.yaml'))) {
      return 'pnpm';
    }
    if (fsSync.existsSync(path.join(dir, 'yarn.lock'))) {
      return 'yarn';
    }
    if (fsSync.existsSync(path.join(dir, 'package-lock.json'))) {
      return 'npm';
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return 'npm';
}

interface ExecResult {
  success: boolean;
  stdout: string;
  stderr: string;
  message: string;
}

async function runCommand(cmd: string, env: Record<string, string> = {}): Promise<ExecResult> {
  const mergedEnv = { ...process.env, ...env } as NodeJS.ProcessEnv;
  
  try {
    const { stdout, stderr } = await execAsync(cmd, {
      env: mergedEnv,
      timeout: 120000, // 2 minute timeout limit
    });
    return {
      success: true,
      stdout,
      stderr,
      message: `Command "${cmd}" completed successfully.`,
    };
  } catch (err: any) {
    return {
      success: false,
      stdout: err.stdout || '',
      stderr: err.stderr || err.message,
      message: `Command "${cmd}" failed with exit code ${err.code || 'unknown'}.`,
    };
  }
}

export async function runTests(testScope?: string, env: Record<string, string> = {}): Promise<ExecResult> {
  const pm = detectPackageManager();
  let cmd = pm === 'npm' ? 'npm test' : `${pm} test`;
  
  if (testScope) {
    cmd += ` -- ${testScope}`;
  }
  
  return runCommand(cmd, env);
}

export async function runLint(scope?: string, rules?: string): Promise<ExecResult> {
  const pm = detectPackageManager();
  let cmd = `${pm} run lint`;
  
  // Custom linter configurations can be appended
  if (scope) {
    cmd += ` -- ${scope}`;
  }
  if (rules) {
    cmd += ` --rules ${rules}`;
  }
  
  return runCommand(cmd);
}

export async function runBuild(target?: string, env: Record<string, string> = {}): Promise<ExecResult> {
  const pm = detectPackageManager();
  let cmd = `${pm} run build`;
  
  if (target) {
    cmd += ` --target ${target}`;
  }
  
  return runCommand(cmd, env);
}

export async function gitDiff(baseRef?: string): Promise<{ success: boolean; diff: string; message: string }> {
  try {
    const cmd = baseRef ? `git diff "${baseRef}"` : 'git diff';
    const { stdout } = await execAsync(cmd);
    return {
      success: true,
      diff: stdout,
      message: baseRef ? `Diff computed against ${baseRef}.` : 'Diff computed for unstaged changes.',
    };
  } catch (err: any) {
    return {
      success: false,
      diff: '',
      message: `Failed to run git diff: ${err.message}`,
    };
  }
}
