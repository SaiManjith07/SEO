import * as fs from 'fs';
import * as path from 'path';
import { detectFramework, type FrameworkType } from './detector.js';

const DEFAULT_ROBOTS = `User-agent: *
Allow: /

# Host
Host: https://example.com

# Sitemaps
Sitemap: https://example.com/sitemap.xml
`;

const DEFAULT_LLMS = `# LLM-Access Guidelines (llms.txt)

This directory serves as the structured index for LLM models, AI agents, and RAG retrievers crawling this domain.

## Project Description
SEOKit optimized project page context and structured schemas.

## Guidelines
- Avoid indexing administrative, raw mock, or unrendered template files.
- Prefer SSR rendered output containing semantic tags and valid rich schemas.
`;

const GITHUB_WORKFLOW = `name: SEOKit Validation PR Audit

on:
  pull_request:
    branches: [ main, master ]

jobs:
  seo-audit:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install Dependencies
        run: npm ci

      - name: Run Build and Lint Checks
        run: |
          npm run build
          npm run lint

      - name: Run SEO validations
        run: npx seokit audit https://example.com --render
`;

export async function initProject(
  projectRoot: string,
  overrideFramework?: string
): Promise<{ framework: string; filesScaffolded: string[] }> {
  const framework: FrameworkType = (overrideFramework as FrameworkType) || detectFramework(projectRoot);
  const filesScaffolded: string[] = [];

  // Create .seokit folder
  const seokitDir = path.join(projectRoot, '.seokit');
  if (!fs.existsSync(seokitDir)) {
    fs.mkdirSync(seokitDir, { recursive: true });
    filesScaffolded.push('.seokit/');
  }

  // Create guidelines.md reference
  const guidelinesPath = path.join(seokitDir, 'guidelines.md');
  const defaultGuidelines = `# Project SEO Guidelines\n\n- Ensure image alt text is present.\n- Canonical tags must use absolute URLs.\n- Robots.txt must not Disallow root crawlers.\n`;
  if (!fs.existsSync(guidelinesPath)) {
    fs.writeFileSync(guidelinesPath, defaultGuidelines, 'utf-8');
    filesScaffolded.push('.seokit/guidelines.md');
  }

  // Determine public directories depending on detected framework
  let publicDir = projectRoot;
  if (framework === 'sveltekit') {
    publicDir = path.join(projectRoot, 'static');
  } else if (['next', 'nuxt', 'astro', 'remix'].includes(framework)) {
    publicDir = path.join(projectRoot, 'public');
  }

  // Create public directory if framework-specific and missing
  if (publicDir !== projectRoot && !fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Scaffold robots.txt
  const robotsPath = path.join(publicDir, 'robots.txt');
  if (!fs.existsSync(robotsPath)) {
    fs.writeFileSync(robotsPath, DEFAULT_ROBOTS, 'utf-8');
    filesScaffolded.push(path.relative(projectRoot, robotsPath));
  }

  // Scaffold llms.txt
  const llmsPath = path.join(publicDir, 'llms.txt');
  if (!fs.existsSync(llmsPath)) {
    fs.writeFileSync(llmsPath, DEFAULT_LLMS, 'utf-8');
    filesScaffolded.push(path.relative(projectRoot, llmsPath));
  }

  // Scaffold GitHub Workflow
  const workflowDir = path.join(projectRoot, '.github', 'workflows');
  if (!fs.existsSync(workflowDir)) {
    fs.mkdirSync(workflowDir, { recursive: true });
  }
  const workflowPath = path.join(workflowDir, 'seokit.yml');
  if (!fs.existsSync(workflowPath)) {
    fs.writeFileSync(workflowPath, GITHUB_WORKFLOW, 'utf-8');
    filesScaffolded.push(path.relative(projectRoot, workflowPath));
  }

  return {
    framework,
    filesScaffolded,
  };
}
