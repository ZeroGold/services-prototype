/**
 * Configuration System Types
 */

export type Environment = 'development' | 'staging' | 'production';

/**
 * Application-level configuration
 */
export interface AppConfig {
  name: string;
  environment: Environment;
  version: string;
  platform: 'pwa' | 'mobile' | 'web' | 'desktop';

  /** Database configuration */
  database: DatabaseConfig;

  /** Enabled services */
  services: ServiceConfig[];

  /** Security settings */
  security?: SecurityConfig;

  /** Custom application settings */
  custom?: Record<string, unknown>;
}

export interface DatabaseConfig {
  provider: 'supabase' | 'postgres' | 'mysql' | 'mongodb';
  url: string;
  apiKey?: string;
  poolSize?: number;
  ssl?: boolean;
}

export interface ServiceConfig {
  name: string;
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface SecurityConfig {
  jwtSecret?: string;
  encryptionKey?: string;
  rateLimiting?: {
    enabled: boolean;
    maxRequests: number;
    windowMs: number;
  };
  cors?: {
    enabled: boolean;
    origins: string[];
  };
}

/**
 * Configuration Provider Interface
 */
export interface IConfigProvider {
  /** Load configuration from source */
  load(): Promise<AppConfig>;

  /** Get configuration value by key */
  get<T = any>(key: string): T | undefined;

  /** Set configuration value */
  set(key: string, value: any): void;

  /** Reload configuration */
  reload(): Promise<void>;

  /** Watch for configuration changes */
  watch(callback: (config: AppConfig) => void): () => void;
}

/**
 * Environment variable mapping
 */
export interface EnvVarMapping {
  [key: string]: {
    envVar: string;
    required?: boolean;
    default?: any;
    transform?: (value: string) => any;
  };
}
