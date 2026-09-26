import { MapRegistry } from './index.js';

export interface DataSource {
  id: string;
  name: string;
  description: string;
  provides: string[];
  modes: ('dev' | 'prod')[];
  requires: {
    credentials: string[];
    network: boolean;
    install?: string;
  };
  backends: {
    dev: 'fixture' | 'live' | 'unavailable';
    prod: 'fixture' | 'live' | 'unavailable';
  };
  cost: 'free' | 'free-tier' | 'paid';
  costNotes?: string;
  suggestFor: string[];
  docsUrl?: string;
}

