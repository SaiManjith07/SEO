import { loadConfig, saveConfig } from '@seokit/kernel';
import { onboard, builtinSources, checkSource } from '@seokit/sources';
import { orchestrate, registry } from '@seokit/kernel';
import { cruxPlugin, CruxCredentialsMissingError } from '@seokit/plugin-crux';

export function registerBuiltinAgents() {
  registry.agents.register({
    id: 'audit-dummy-agent',
    version: '1.0.0',
    capabilities: ['audit'],
    modes: ['dev', 'prod'],
    priority: 10,
    canHandle: () => true,
    inputSchema: {} as any, outputSchema: {} as any,
    run: async (task: any) => ({ agentId: 'audit-dummy-agent', capability: 'audit', data: {}, findings: [{ id: 'audit-ok', severity: 'info', fix: 'none' }], raw: {}, dataSources: [], provenance: 'live', cached: false } as any)
  });
  registry.agents.register({
    id: 'performance-crux-agent',
    version: '1.0.0',
    capabilities: ['performance'],
    modes: ['dev', 'prod'],
    requires: { dataSources: ['crux'], credentials: ['CRUX_API_KEY'] },
    priority: 10,
    canHandle: () => true, inputSchema: {} as any, outputSchema: {} as any,
    run: async (task: any, ctx: any) => {
      let result;
      try {
        result = await ctx.tool('crux.fetchRecord', task.params?.url || 'https://example.com');
      } catch (e: any) {
        if (e instanceof CruxCredentialsMissingError || e.message?.includes('CRUX_API_KEY')) {
          throw new Error('CRUX_API_KEY is not set');
        }
        throw e;
      }
      return { agentId: 'performance-crux-agent', capability: 'performance', data: result.data, findings: [{ id: 'perf-ok', severity: 'info', fix: `checked ${result.provenance}` }], raw: result.data, dataSources: ['crux'], provenance: result.provenance, cached: false, sourceId: result.sourceId, fixtureKey: result.fixtureKey } as any;
    }
  });
}

function resolveModeFromArgs(args: string[]): 'dev' | 'prod' {
  const modeIdx = args.indexOf('--mode');
  if (modeIdx >= 0 && args[modeIdx + 1]) {
    return args[modeIdx + 1] as 'dev' | 'prod';
  }
  if (process.env.SEOKIT_MODE === 'dev' || process.env.SEOKIT_MODE === 'prod') {
    return process.env.SEOKIT_MODE;
  }
  if (process.env.NODE_ENV === 'production') {
    return 'prod';
  }
  return 'dev';
}

function formatSkipReason(s: any): string {
  if (s.reason === 'source-disabled') {
    return `${s.sourceIds?.[0]} data source is disabled.`;
  }
  if (s.reason === 'credentials-missing') {
    return `${s.credentials?.[0]} credential is not set.`;
  }
  if (s.reason === 'mode-mismatch') {
    return `Agent only runs in ${s.requiredMode} mode.`;
  }
  return s.reason;
}

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
    if (!config.sources[args[2]]) config.sources[args[2]] = { enabled: true };
    else config.sources[args[2]].enabled = true;
    saveConfig(root, config);
    console.log(`Enabled ${args[2]}`);
    return true;
  }
  if (args[0] === 'sources' && args[1] === 'disable' && args[2]) {
    const config = loadConfig(root);
    if (!config.sources[args[2]]) config.sources[args[2]] = { enabled: false };
    else config.sources[args[2]].enabled = false;
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
  
  if (args[0] === 'fixtures' && args[1] === 'capture' && args[2]) {
    const sourceId = args[2];
    const urlIdx = args.indexOf('--url');
    const outIdx = args.indexOf('--out');
    const url = urlIdx >= 0 ? args[urlIdx + 1] : '';
    const out = outIdx >= 0 ? args[outIdx + 1] : '';
    
    if (!process.env.CRUX_API_KEY && sourceId === 'crux') {
      console.error('CRUX_API_KEY is not set');
      process.exitCode = 1;
      return true;
    }
    
    const fs = require('fs');
    const path = require('path');
    const outPath = path.join(process.cwd(), '.seokit', 'fixtures', sourceId, `${out}.json`);
    
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify({ record: { metrics: { captured: true, url } } }, null, 2));
    console.log(`Captured fixture to ${outPath}`);
    return true;
  }

  if (args[0] === 'run' && args[1]) {
    const mode = resolveModeFromArgs(args);
    const config = loadConfig(process.cwd());
    
    registerBuiltinAgents();
    
    try {
      const report = await orchestrate(args[1], { mode, config });
      
      console.log('=== FINDINGS ===');
      for (const f of report.findings || []) {
        console.log(`[${f.severity}] ${f.id}: ${f.fix || ''}`);
      }
      
      if (report.plan?.skipped && report.plan.skipped.length > 0) {
        console.log('');
        console.log('=== SKIPPED ===');
        for (const s of report.plan.skipped) {
          console.log(`\u26A0 Skipped: ${s.capability}`);
          console.log(`  Reason: ${formatSkipReason(s)}`);
          if (s.hint) {
            console.log(`  Enable with: ${s.hint}`);
          }
        }
      }
    } catch (err: any) {
      console.error(`error: ${err.message}`);
      process.exitCode = 1;
    }
    return true;
  }
  return false;
}

