import * as fs from 'fs';
import * as path from 'path';

export interface CapabilityManifest {
  id: string;
  version: string;
  rules: string[];
  validators: string[];
  frameworkCapabilities: string[];
  dependencies: string[];
  events: string[];
}

export class CapabilityRegistry {
  private capabilities: Map<string, CapabilityManifest> = new Map();

  public registerCapability(manifest: CapabilityManifest): void {
    this.capabilities.set(manifest.id, manifest);
  }

  public getCapability(id: string): CapabilityManifest | undefined {
    return this.capabilities.get(id);
  }

  public unregisterCapability(id: string): void {
    this.capabilities.delete(id);
  }

  public loadFromDirectory(dirPath: string): void {
    if (!fs.existsSync(dirPath)) return;
    
    // Stub for loading JSON manifests
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(dirPath, file), 'utf-8');
        const manifest = JSON.parse(content) as CapabilityManifest;
        this.registerCapability(manifest);
      } catch (err) {
        console.error(`Failed to load manifest ${file}:`, err);
      }
    }
  }

  public getAllCapabilities(): CapabilityManifest[] {
    return Array.from(this.capabilities.values());
  }
}
