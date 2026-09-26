import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { main } from './index.js';

describe('SEOKit llms.txt validation', () => {
  const tempDir = path.resolve('temp_cli_llmstxt_test');

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

  const runVerify = async (content: string) => {
    fs.writeFileSync(path.join(tempDir, 'llms.txt'), content, 'utf8');
    const originalArgv = process.argv;
    const originalExit = process.exit;
    process.argv = ['node', 'seokit', 'verify', '--llms-txt', '--path', tempDir];
    
    let exitCode = 0;
    const exitMock = vi.fn((code: number) => { exitCode = code; throw new Error('exit'); });
    // @ts-ignore
    process.exit = exitMock as any;

    try {
      await main();
    } catch (e: any) {
      if (e.message !== 'exit') throw e;
    }

    process.argv = originalArgv;
    process.exit = originalExit;
    return exitCode;
  };

  it('valid llms.txt passes', async () => {
    const validContent = `# My Site

## Section 1
[Link 1](http://example.com)

## Section 2
[Link 2](http://example.com)
`;
    const code = await runVerify(validContent);
    expect(code).toBe(0);
  });

  it('no H1 fails', async () => {
    const invalidContent = `## Section 1
[Link 1](http://example.com)
`;
    const code = await runVerify(invalidContent);
    expect(code).toBe(1);
  });

  it('no sections fails', async () => {
    const invalidContent = `# My Site
No sections here!
`;
    const code = await runVerify(invalidContent);
    expect(code).toBe(1);
  });

  it('HTML tags fails', async () => {
    const invalidContent = `# My Site
<div>HTML!</div>
## Section 1
[Link 1](http://example.com)
`;
    const code = await runVerify(invalidContent);
    expect(code).toBe(1);
  });

  it('missing markdown link in section fails', async () => {
    const invalidContent = `# My Site
## Section 1
Just text, no link
`;
    const code = await runVerify(invalidContent);
    expect(code).toBe(1);
  });
});
