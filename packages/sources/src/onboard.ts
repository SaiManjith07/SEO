import { loadConfig, saveConfig } from '../../kernel/src/index.js';
import { suggest } from './suggest.js';
import { builtinSources } from './catalog.js';
// Using a mock prompt for demonstration to avoid external deps
// In real use, import * as p from '@clack/prompts';

export async function onboard(repoRoot: string): Promise<void> {
  const config = loadConfig(repoRoot);

  const isTTY = process.stdout.isTTY;

  if (!isTTY) {
    // CI / Non-interactive
    console.log('Non-interactive environment detected. Applying defaults.');
    const suggestions = suggest(config.goals);
    for (const s of suggestions.recommended) {
      config.sources[s.id] = { enabled: true };
      console.log(`Enabled recommended source: ${s.id}`);
    }
    saveConfig(repoRoot, config);
    return;
  }

  // Mock interactive flow
  console.log('--- SEOKit Onboarding ---');
  console.log('Goals:', config.goals.length > 0 ? config.goals.join(', ') : 'None');
  
  const suggestions = suggest(config.goals);
  
  console.log('\nRecommended Sources:');
  for (const s of suggestions.recommended) {
    console.log(`- ${s.name} (${s.cost})`);
  }

  console.log('\n(Interactive prompts skipped in mock)');
  for (const s of suggestions.recommended) {
    config.sources[s.id] = { enabled: true };
    console.log(`Enabled ${s.id}`);
  }
  
  saveConfig(repoRoot, config);
  console.log('\nConfiguration saved.');
}
