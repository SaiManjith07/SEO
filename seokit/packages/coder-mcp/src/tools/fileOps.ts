import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const DEFAULT_IGNORES = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.seokit',
  '.next',
  '.nuxt',
  'out',
];

function shouldIgnore(name: string, absolutePath: string, filters: string[]): boolean {
  if (DEFAULT_IGNORES.includes(name)) return true;
  for (const filter of filters) {
    if (name.includes(filter) || absolutePath.includes(filter)) {
      return true;
    }
  }
  return false;
}

export async function listFiles(rootPath: string, filters: string[] = []): Promise<string[]> {
  const resolvedRoot = path.resolve(rootPath);
  const files: string[] = [];

  async function scan(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (shouldIgnore(entry.name, fullPath, filters)) {
        continue;
      }
      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (entry.isFile()) {
        files.push(path.relative(resolvedRoot, fullPath).replace(/\\/g, '/'));
      }
    }
  }

  if (fsSync.existsSync(resolvedRoot)) {
    await scan(resolvedRoot);
  }
  return files;
}

export async function readFile(filePath: string): Promise<{ content: string; size: number; mtime: string }> {
  const resolvedPath = path.resolve(filePath);
  const content = await fs.readFile(resolvedPath, 'utf-8');
  const stat = await fs.stat(resolvedPath);
  return {
    content,
    size: stat.size,
    mtime: stat.mtime.toISOString(),
  };
}

export interface SearchMatch {
  file: string;
  line: number;
  content: string;
}

export async function searchCode(query: string, rootPath: string, paths: string[] = []): Promise<SearchMatch[]> {
  const allFiles = await listFiles(rootPath, []);
  const matches: SearchMatch[] = [];
  const regex = new RegExp(query, 'i');

  for (const relPath of allFiles) {
    // If paths constraint is provided, ensure file matches at least one path prefix
    if (paths.length > 0 && !paths.some(p => relPath.startsWith(p))) {
      continue;
    }

    const fullPath = path.join(rootPath, relPath);
    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      const lines = content.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        if (regex.test(lines[i])) {
          matches.push({
            file: relPath,
            line: i + 1,
            content: lines[i].trim(),
          });
          if (matches.length >= 100) return matches; // Hard cap of 100 matches to prevent output flooding
        }
      }
    } catch {
      // Skip binary or unreadable files
    }
  }
  return matches;
}

export async function applyPatch(patch: string, commitMessage?: string): Promise<{ success: boolean; message: string; commitId?: string }> {
  const tempPatchPath = path.join(process.cwd(), `.seokit_patch_${Date.now()}.patch`);
  
  try {
    await fs.writeFile(tempPatchPath, patch, 'utf-8');

    // Attempt to apply the patch using git apply
    let applyCmd = `git apply "${tempPatchPath}"`;
    try {
      await execAsync(applyCmd);
    } catch (err: any) {
      return {
        success: false,
        message: `Patch application failed:\n${err.stderr || err.message}`,
      };
    }

    let commitId: string | undefined = undefined;

    if (commitMessage) {
      try {
        // Stage modified files and commit
        await execAsync('git add -A');
        const commitResult = await execAsync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`);
        // Extract commit ID
        const match = commitResult.stdout.match(/\[[^\s]+ ([a-f0-9]+)\]/);
        if (match) {
          commitId = match[1];
        }
      } catch (err: any) {
        return {
          success: true,
          message: `Patch applied successfully, but git commit failed: ${err.message}`,
        };
      }
    }

    return {
      success: true,
      message: commitMessage 
        ? `Patch applied and committed successfully.` 
        : `Patch applied successfully (unstaged changes).`,
      commitId,
    };
  } finally {
    if (fsSync.existsSync(tempPatchPath)) {
      await fs.unlink(tempPatchPath);
    }
  }
}
