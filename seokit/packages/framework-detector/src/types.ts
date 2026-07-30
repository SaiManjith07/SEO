export type SupportedFramework =
  | 'Next.js'
  | 'React'
  | 'Vue'
  | 'Nuxt'
  | 'Angular'
  | 'Astro'
  | 'Svelte'
  | 'Remix'
  | 'Gatsby'
  | 'Vite'
  | 'Express'
  | 'Static HTML'
  | 'Unknown';

export type RenderingMode = 'Static' | 'CSR' | 'SSR' | 'SSG' | 'ISR' | 'Hybrid';

export interface DetectionEvidence {
  source: 'HTML' | 'JS' | 'Route' | 'Header' | 'Build';
  marker: string;
  detail?: string;
}

export interface FrameworkDetectionResult {
  framework: SupportedFramework;
  version?: string;
  renderingMode: RenderingMode;
  confidence: number; // percentage, e.g. 0 to 100
  evidence: DetectionEvidence[];
}

export interface DetectionStrategy {
  name: string;
  detect(
    html: string,
    headers: Record<string, string>,
    routes: string[],
    buildFiles: Record<string, string>
  ): FrameworkDetectionResult | null;
}
