import { DataSource } from '../../kernel/src/index.js';

export function checkSource(source: DataSource, env: NodeJS.ProcessEnv): {
  configured: boolean;
  credentialsPresent: string[];
  credentialsMissing: string[];
  reachable: boolean | 'unknown';
} {
  const credentialsPresent: string[] = [];
  const credentialsMissing: string[] = [];
  
  for (const cred of source.requires.credentials) {
    if (env[cred]) {
      credentialsPresent.push(cred);
    } else {
      credentialsMissing.push(cred);
    }
  }

  let reachable: boolean | 'unknown' = 'unknown';

  if (source.cost === 'free' && source.requires.credentials.length === 0 && source.requires.network) {
    // In a real implementation we would ping the service. 
    // Here we'll just mock it as reachable for free sources without creds.
    reachable = true;
  }

  return {
    configured: credentialsMissing.length === 0,
    credentialsPresent,
    credentialsMissing,
    reachable
  };
}
