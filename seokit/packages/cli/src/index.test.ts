import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { main } from './index.js';

describe('SEOKit v2 Platform CLI Integrations', () => {
  const tempDir = path.resolve('temp_cli_platform_test');

  beforeAll(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should auto-generate Cursor and Antigravity config files on init subcommand', async () => {
    const originalArgv = process.argv;
    const originalExit = process.exit;

    process.argv = ['node', 'seokit', 'init', tempDir];
    
    const exitMock = vi.fn();
    // @ts-ignore
    process.exit = exitMock as any;

    await main();

    process.argv = originalArgv;
    process.exit = originalExit;

    const cursorMcp = path.join(tempDir, '.cursor', 'mcp.json');
    const agentsMcp = path.join(tempDir, '.agents', 'mcp.json');

    expect(fs.existsSync(cursorMcp)).toBe(true);
    expect(fs.existsSync(agentsMcp)).toBe(true);

    const cursorConfig = JSON.parse(fs.readFileSync(cursorMcp, 'utf-8'));
    expect(cursorConfig.mcpServers.seokit.command).toBe('node');
    expect(cursorConfig.mcpServers.seokit.args[0]).toContain('/mcp/dist/index.js');
  });

  it('should execute doctor diagnostics checks successfully', async () => {
    const originalArgv = process.argv;
    const originalExit = process.exit;

    process.argv = ['node', 'seokit', 'doctor', tempDir];
    
    const exitMock = vi.fn();
    // @ts-ignore
    process.exit = exitMock as any;

    await main();

    process.argv = originalArgv;
    process.exit = originalExit;
    expect(exitMock).toHaveBeenCalled();
  }, 20000);

  it('should create log file and record steps during verify run', async () => {
    const originalArgv = process.argv;
    const originalExit = process.exit;

    process.argv = ['node', 'seokit', 'verify', tempDir];
    
    const exitMock = vi.fn();
    // @ts-ignore
    process.exit = exitMock as any;

    await main();

    process.argv = originalArgv;
    process.exit = originalExit;

    const logFile = path.join(tempDir, '.seokit', 'logs', 'verification.log');
    expect(fs.existsSync(logFile)).toBe(true);

    const logs = fs.readFileSync(logFile, 'utf-8');
    expect(logs).toContain('SEOKit Verification Started');
    expect(logs).toContain('--- Final Verification Summary ---');
  });
});
