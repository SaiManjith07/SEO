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
  cost: 'free' | 'free-tier' | 'paid';
  costNotes?: string;
  suggestFor: string[];
  docsUrl?: string;
}

