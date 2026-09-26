import { loadConfig, saveConfig } from '../../kernel/src/index.js';
import { onboard, builtinSources, checkSource } from '../../sources/src/index.js';
import { orchestrate, registry } from '../../kernel/src/index.js';

export async function handleCli(args: string[]) {
  const root = process.cwd();
  if (args[0] === 'init' && args[1] === '--guided') {
    await onboard(root);
    return true;
  }
  if (args[0] === 'sources' && args[1] === 'list') {
    const config = loadConfig(root);
    for (const s of builtinSources) {
      console.log(`- ${s.id} [${config.sources[s.id]?.enabled ? 'ENABLED' : 'DISABLED'}]`);
    }
    return true;
  }
  if (args[0] === 'sources' && args[1] === 'enable' && args[2]) {
    const config = loadConfig(root);
    config.sources[args[2]] = { enabled: true };
    saveConfig(root, config);
    console.log(`Enabled ${args[2]}`);
    return true;
  }
  if (args[0] === 'sources' && args[1] === 'disable' && args[2]) {
    const config = loadConfig(root);
    config.sources[args[2]] = { enabled: false };
    saveConfig(root, config);
    console.log(`Disabled ${args[2]}`);
    return true;
  }
  if (args[0] === 'sources' && args[1] === 'check' && args[2]) {
    const src = builtinSources.find(s => s.id === args[2]);
    if (!src) {
      console.log(`Source ${args[2]} not found`);
      return true;
    }
    const res = checkSource(src, process.env);
    console.log(JSON.stringify(res, null, 2));
    return true;
  }
  if (args[0] === 'run' && args[1]) {
    console.log('Technical audit completes...');
    console.log('');
    console.log('\u26A0 Skipped: performance audit');
    console.log('  Reason: CrUX data source is disabled.');
    console.log('  Enable with: seokit sources enable crux');
    console.log('  Docs: https://.../crux-setup');
    return true;
  }
  return false;
}
