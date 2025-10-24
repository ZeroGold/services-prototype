import { AppConfig, IConfigProvider } from '@shared/types';

/**
 * Configuration Provider
 * Manages application configuration with support for environment variables
 */
export class ConfigProvider implements IConfigProvider {
  private config?: AppConfig;
  private watchers: Set<(config: AppConfig) => void> = new Set();

  async load(): Promise<AppConfig> {
    // Load configuration from environment variables and/or config file
    const config = await this.loadFromEnvironment();
    this.config = config;
    return config;
  }

  get<T = any>(key: string): T | undefined {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first.');
    }

    // Support nested keys like 'database.url'
    const keys = key.split('.');
    let value: any = this.config;

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return undefined;
      }
    }

    return value as T;
  }

  set(key: string, value: any): void {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first.');
    }

    const keys = key.split('.');
    let target: any = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in target)) {
        target[k] = {};
      }
      target = target[k];
    }

    target[keys[keys.length - 1]] = value;
    this.notifyWatchers();
  }

  async reload(): Promise<void> {
    await this.load();
    this.notifyWatchers();
  }

  watch(callback: (config: AppConfig) => void): () => void {
    this.watchers.add(callback);
    return () => {
      this.watchers.delete(callback);
    };
  }

  private notifyWatchers(): void {
    if (this.config) {
      this.watchers.forEach(watcher => watcher(this.config!));
    }
  }

  private async loadFromEnvironment(): Promise<AppConfig> {
    // Default configuration
    const config: AppConfig = {
      name: process.env.APP_NAME || 'cloneable-services-app',
      environment: (process.env.NODE_ENV as any) || 'development',
      version: process.env.APP_VERSION || '0.1.0',
      platform: (process.env.PLATFORM as any) || 'pwa',

      database: {
        provider: (process.env.DB_PROVIDER as any) || 'supabase',
        url: process.env.DATABASE_URL || '',
        apiKey: process.env.SUPABASE_KEY,
        ssl: process.env.DB_SSL === 'true',
      },

      services: this.parseServices(process.env.ENABLED_SERVICES || ''),

      security: {
        jwtSecret: process.env.JWT_SECRET,
        encryptionKey: process.env.ENCRYPTION_KEY,
        rateLimiting: {
          enabled: process.env.RATE_LIMITING_ENABLED === 'true',
          maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100'),
          windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'),
        },
        cors: {
          enabled: process.env.CORS_ENABLED === 'true',
          origins: process.env.CORS_ORIGINS?.split(',') || [],
        },
      },

      custom: {},
    };

    return config;
  }

  private parseServices(servicesString: string): any[] {
    if (!servicesString) return [];

    return servicesString.split(',').map(name => ({
      name: name.trim(),
      enabled: true,
      config: {},
    }));
  }
}

/**
 * Singleton instance
 */
export const configProvider = new ConfigProvider();
