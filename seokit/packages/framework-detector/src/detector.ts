import * as cheerio from 'cheerio';
import { RawResource } from '@seokit/parser';
import { Website } from '@seokit/website';
import {
  FrameworkDetectionResult,
  SupportedFramework,
  RenderingMode,
  DetectionEvidence
} from './types.js';

export class FrameworkDetector {
  public static detect(
    website: Website,
    rawResources: RawResource[]
  ): FrameworkDetectionResult {
    const evidences: DetectionEvidence[] = [];

    // Collect variables
    let mergedHtml = '';
    const routes: string[] = [];
    const headers: Record<string, string> = {};
    const buildFiles: Record<string, string> = {};

    // 1. Gather info from raw resources
    for (const res of rawResources) {
      const contentStr = typeof res.content === 'string' ? res.content : res.content.toString();
      if (res.route.endsWith('.html') || res.route === '/' || res.route.startsWith('/page')) {
        mergedHtml += `\n${contentStr}`;
      }
      routes.push(res.route);
      if (res.headers) {
        for (const [k, v] of Object.entries(res.headers)) {
          headers[k.toLowerCase()] = String(v);
        }
      }
      // Capture build files
      const baseName = res.sourcePath.split('/').pop() || '';
      if (
        baseName.includes('package.json') ||
        baseName.includes('config') ||
        baseName.includes('angular.json')
      ) {
        buildFiles[baseName] = contentStr;
      }
    }

    // 2. Gather info from website model
    for (const page of Object.values(website.pages)) {
      mergedHtml += `\n${page.rawHtml}`;
      if (page.headers) {
        for (const [k, v] of Object.entries(page.headers)) {
          headers[k.toLowerCase()] = String(v);
        }
      }
    }

    // Check Headers
    if (headers['x-powered-by']) {
      const val = headers['x-powered-by'];
      if (val.toLowerCase().includes('next')) {
        evidences.push({ source: 'Header', marker: 'x-powered-by: nextjs', detail: val });
      } else if (val.toLowerCase().includes('express')) {
        evidences.push({ source: 'Header', marker: 'x-powered-by: express', detail: val });
      }
    }

    // Check Routes Routing structures
    for (const r of routes) {
      if (r.includes('/_next/')) {
        evidences.push({ source: 'Route', marker: '/_next/', detail: r });
      }
      if (r.includes('/_nuxt/')) {
        evidences.push({ source: 'Route', marker: '/_nuxt/', detail: r });
      }
      if (r.includes('/assets/')) {
        evidences.push({ source: 'Route', marker: '/assets/', detail: r });
      }
    }

    // Check Build Config files
    for (const [name, content] of Object.entries(buildFiles)) {
      if (name === 'package.json') {
        if (content.includes('"next"')) {
          evidences.push({ source: 'Build', marker: 'package.json: next', detail: 'next dependency' });
        }
        if (content.includes('"nuxt"')) {
          evidences.push({ source: 'Build', marker: 'package.json: nuxt', detail: 'nuxt dependency' });
        }
        if (content.includes('"react"')) {
          evidences.push({ source: 'Build', marker: 'package.json: react', detail: 'react dependency' });
        }
        if (content.includes('"vue"')) {
          evidences.push({ source: 'Build', marker: 'package.json: vue', detail: 'vue dependency' });
        }
        if (content.includes('"@angular/core"')) {
          evidences.push({ source: 'Build', marker: 'package.json: angular', detail: 'angular dependency' });
        }
        if (content.includes('"astro"')) {
          evidences.push({ source: 'Build', marker: 'package.json: astro', detail: 'astro dependency' });
        }
      }
      if (name === 'next.config.js') {
        evidences.push({ source: 'Build', marker: 'next.config.js', detail: 'NextJS config exists' });
      }
      if (name === 'astro.config.mjs') {
        evidences.push({ source: 'Build', marker: 'astro.config.mjs', detail: 'Astro config exists' });
      }
      if (name === 'vite.config.ts' || name === 'vite.config.js') {
        evidences.push({ source: 'Build', marker: 'vite.config', detail: 'Vite config exists' });
      }
    }

    // Check HTML markers
    if (mergedHtml) {
      const $ = cheerio.load(mergedHtml);

      // Meta generator check
      const generator = $('meta[name="generator"]').attr('content') || '';
      if (generator) {
        if (generator.toLowerCase().includes('next.js') || generator.toLowerCase().includes('nextjs')) {
          evidences.push({ source: 'HTML', marker: 'meta generator: Next.js', detail: generator });
        } else if (generator.toLowerCase().includes('nuxt')) {
          evidences.push({ source: 'HTML', marker: 'meta generator: Nuxt', detail: generator });
        } else if (generator.toLowerCase().includes('astro')) {
          evidences.push({ source: 'HTML', marker: 'meta generator: Astro', detail: generator });
        } else if (generator.toLowerCase().includes('gatsby')) {
          evidences.push({ source: 'HTML', marker: 'meta generator: Gatsby', detail: generator });
        } else if (generator.toLowerCase().includes('svelte')) {
          evidences.push({ source: 'HTML', marker: 'meta generator: Svelte', detail: generator });
        }
      }

      // Next.js markers
      if ($('meta[name="next-head-count"]').length > 0) {
        evidences.push({ source: 'HTML', marker: 'meta[name="next-head-count"]' });
      }
      if (mergedHtml.includes('__NEXT_DATA__')) {
        evidences.push({ source: 'HTML', marker: 'script: __NEXT_DATA__' });
      }
      if (mergedHtml.includes('next/image')) {
        evidences.push({ source: 'HTML', marker: 'next/image attribute' });
      }

      // Nuxt markers
      if (mergedHtml.includes('__NUXT__')) {
        evidences.push({ source: 'HTML', marker: 'script: __NUXT__' });
      }
      if ($('#__nuxt').length > 0) {
        evidences.push({ source: 'HTML', marker: 'div id: __nuxt' });
      }

      // React / ReactDOM markers
      if (mergedHtml.includes('react-root') || mergedHtml.includes('_react') || mergedHtml.includes('data-reactroot')) {
        evidences.push({ source: 'HTML', marker: 'React attributes' });
      }
      if (mergedHtml.includes('ReactDOM')) {
        evidences.push({ source: 'HTML', marker: 'JS: ReactDOM variable' });
      }

      // Angular markers
      if ($('app-root').length > 0) {
        evidences.push({ source: 'HTML', marker: 'app-root tag' });
      }
      const hasNgAttr = mergedHtml.includes('_nghost-') || mergedHtml.includes('_ngcontent-');
      if (hasNgAttr) {
        evidences.push({ source: 'HTML', marker: 'Angular ng-attributes' });
      }

      // Astro markers
      if (mergedHtml.includes('astro-') || mergedHtml.includes('data-astro-')) {
        evidences.push({ source: 'HTML', marker: 'Astro class/data attributes' });
      }

      // Svelte markers
      if (mergedHtml.includes('svelte-') || mergedHtml.includes('data-sveltekit-')) {
        evidences.push({ source: 'HTML', marker: 'Svelte class/data attributes' });
      }

      // Remix markers
      if (mergedHtml.includes('__remixManifest') || mergedHtml.includes('window.__remixContext')) {
        evidences.push({ source: 'HTML', marker: 'Remix window context state' });
      }

      // Gatsby markers
      if ($('#___gatsby').length > 0) {
        evidences.push({ source: 'HTML', marker: 'div id: ___gatsby' });
      }

      // Vite markers
      if (mergedHtml.includes('/@vite/client')) {
        evidences.push({ source: 'HTML', marker: '/@vite/client reference' });
      }
    }

    // Determine Framework based on evidences
    let framework: SupportedFramework = 'Unknown';
    let version: string | undefined = undefined;
    let renderingMode: RenderingMode = 'Static';
    let confidence = 0;

    const hasEvidence = (marker: string) =>
      evidences.some(e => e.marker.toLowerCase().includes(marker.toLowerCase()));

    if (hasEvidence('next')) {
      framework = 'Next.js';
      version = '15';
      renderingMode = 'Hybrid';
      confidence = 98;
    } else if (hasEvidence('nuxt')) {
      framework = 'Nuxt';
      renderingMode = 'SSR';
      confidence = 95;
    } else if (hasEvidence('astro')) {
      framework = 'Astro';
      renderingMode = 'SSG';
      confidence = 95;
    } else if (hasEvidence('angular') || hasEvidence('app-root')) {
      framework = 'Angular';
      renderingMode = 'CSR';
      confidence = 90;
    } else if (hasEvidence('remix')) {
      framework = 'Remix';
      renderingMode = 'SSR';
      confidence = 95;
    } else if (hasEvidence('gatsby')) {
      framework = 'Gatsby';
      renderingMode = 'SSG';
      confidence = 90;
    } else if (hasEvidence('svelte')) {
      framework = 'Svelte';
      renderingMode = 'Hybrid';
      confidence = 90;
    } else if (hasEvidence('react')) {
      framework = 'React';
      renderingMode = 'CSR';
      confidence = 85;
    } else if (hasEvidence('vue')) {
      framework = 'Vue';
      renderingMode = 'CSR';
      confidence = 85;
    } else if (hasEvidence('vite')) {
      framework = 'Vite';
      renderingMode = 'CSR';
      confidence = 80;
    } else if (hasEvidence('express')) {
      framework = 'Express';
      renderingMode = 'SSR';
      confidence = 80;
    } else if (mergedHtml.trim().length > 0) {
      framework = 'Static HTML';
      renderingMode = 'Static';
      confidence = 100;
    }

    return {
      framework,
      version,
      renderingMode,
      confidence,
      evidence: evidences
    };
  }
}
