import { RawResource } from '@seokit/parser';
import { ProviderCapabilities } from './types.js';

export abstract class WebsiteProvider {
  protected target: string;
  protected options: Record<string, any>;

  constructor(target: string, options: Record<string, any> = {}) {
    this.target = target;
    this.options = options;
  }

  /**
   * Advertise capabilities of this provider subclass
   */
  public abstract getCapabilities(): ProviderCapabilities;

  /**
   * Checks if this provider is suitable for loading the target path/URI
   */
  public abstract canVerify(): Promise<boolean>;

  /**
   * Initializes internal connections, head browsers, or workspace configurations
   */
  public abstract initialize(): Promise<void>;

  /**
   * Reads raw assets and HTML data from target without parsing
   */
  public abstract acquireRawResources(): Promise<RawResource[]>;

  /**
   * Closes browser sessions, servers, or file stream links
   */
  public abstract shutdown(): Promise<void>;
}
