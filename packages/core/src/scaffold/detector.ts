import * as fs from 'fs';
import * as path from 'path';

export type FrameworkType = 'next' | 'nuxt' | 'astro' | 'sveltekit' | 'remix' | 'static' | 'unknown';

export function detectFramework(projectRoot: string): FrameworkType {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  let dependencies: Record<string, string> = {};
  let devDependencies: Record<string, string> = {};

  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      dependencies = pkg.dependencies || {};
      devDependencies = pkg.devDependencies || {};
    } catch {
      // Ignore parse errors, proceed to file-based detection
    }
  }

  // 1. Next.js Check
  if (dependencies['next'] || devDependencies['next'] || 
      fs.existsSync(path.join(projectRoot, 'next.config.js')) || 
      fs.existsSync(path.join(projectRoot, 'next.config.mjs'))) {
    return 'next';
  }

  // 2. Nuxt.js Check
  if (dependencies['nuxt'] || devDependencies['nuxt'] || 
      fs.existsSync(path.join(projectRoot, 'nuxt.config.js')) || 
      fs.existsSync(path.join(projectRoot, 'nuxt.config.ts'))) {
    return 'nuxt';
  }

  // 3. Astro Check
  if (dependencies['astro'] || devDependencies['astro'] || 
      fs.existsSync(path.join(projectRoot, 'astro.config.mjs')) || 
      fs.existsSync(path.join(projectRoot, 'astro.config.ts'))) {
    return 'astro';
  }

  // 4. SvelteKit Check
  if (dependencies['@sveltejs/kit'] || devDependencies['@sveltejs/kit'] || 
      fs.existsSync(path.join(projectRoot, 'svelte.config.js'))) {
    return 'sveltekit';
  }

  // 5. Remix Check
  if (dependencies['@remix-run/react'] || devDependencies['@remix-run/react'] || 
      fs.existsSync(path.join(projectRoot, 'remix.config.js')) || 
      fs.existsSync(path.join(projectRoot, 'vite.config.ts')) && dependencies['@remix-run/dev']) {
    return 'remix';
  }

  // 6. Static HTML Check
  const files = fs.readdirSync(projectRoot);
  const hasHtml = files.some(file => file.endsWith('.html') || file.endsWith('.htm'));
  if (hasHtml) {
    return 'static';
  }

  return 'unknown';
}
