import { Agent, Tool } from '../types.js';

class MapRegistry<T extends { id: string }> {
  private items = new Map<string, T>();

  register(item: T) {
    if (!item || typeof item.id !== 'string') {
      throw new Error('Registration failed: missing required field "id"');
    }
    if (this.items.has(item.id)) {
      console.warn(`[Registry] Overwriting existing item with id: ${item.id}`);
    }
    this.items.set(item.id, item);
  }

  get(id: string): T | undefined {
    return this.items.get(id);
  }

  list(): T[] {
    return Array.from(this.items.values());
  }

  clear() {
    this.items.clear();
  }
}

export const agents = new MapRegistry<Agent>();
export const tools = new MapRegistry<Tool>();
export const plugins = new MapRegistry<{ id: string, [key: string]: any }>();
export const validators = new MapRegistry<any>();
export const adapters = new MapRegistry<{ id: string, [key: string]: any }>();
