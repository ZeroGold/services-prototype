/**
 * Base Service Interface
 * All cloneable services must implement this interface
 */

export interface ServiceMetadata {
  name: string;
  version: string;
  description: string;
  author?: string;
  license?: string;
  dependencies?: string[];
  platforms: PlatformType[];
}

export type PlatformType = 'pwa' | 'mobile' | 'web' | 'desktop';

export type ServiceStatus = 'initializing' | 'ready' | 'error' | 'disabled';

export interface ServiceHealth {
  status: ServiceStatus;
  message?: string;
  lastCheck: Date;
  details?: Record<string, unknown>;
}

/**
 * Base Service Interface
 * Every cloneable service must implement this
 */
export interface IService<TConfig = any> {
  /** Service metadata */
  readonly metadata: ServiceMetadata;

  /** Service configuration */
  config: TConfig;

  /** Initialize the service with configuration */
  initialize(config: TConfig): Promise<void>;

  /** Check service health and status */
  healthCheck(): Promise<ServiceHealth>;

  /** Gracefully shutdown the service */
  shutdown(): Promise<void>;

  /** Get current service status */
  getStatus(): ServiceStatus;
}

/**
 * Service Lifecycle Events
 */
export interface ServiceLifecycle {
  onBeforeInit?: () => Promise<void> | void;
  onAfterInit?: () => Promise<void> | void;
  onBeforeShutdown?: () => Promise<void> | void;
  onAfterShutdown?: () => Promise<void> | void;
  onError?: (error: Error) => Promise<void> | void;
}

/**
 * Service Context
 * Shared context available to all services
 */
export interface ServiceContext {
  environment: 'development' | 'staging' | 'production';
  platform: PlatformType;
  database?: DatabaseConnection;
  logger?: Logger;
  eventBus?: EventBus;
}

export interface DatabaseConnection {
  host: string;
  database: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query<T = any>(sql: string, params?: any[]): Promise<T>;
}

export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: Error, meta?: Record<string, unknown>): void;
}

export interface EventBus {
  emit(event: string, data: any): void;
  on(event: string, handler: (data: any) => void): () => void;
  once(event: string, handler: (data: any) => void): () => void;
}

/**
 * Base Service Class
 * Abstract class that services can extend
 */
export abstract class BaseService<TConfig = any> implements IService<TConfig> {
  abstract readonly metadata: ServiceMetadata;

  protected _status: ServiceStatus = 'initializing';
  protected _config?: TConfig;
  protected context?: ServiceContext;

  get config(): TConfig {
    if (!this._config) {
      throw new Error(`Service ${this.metadata.name} not initialized`);
    }
    return this._config;
  }

  set config(value: TConfig) {
    this._config = value;
  }

  async initialize(config: TConfig, context?: ServiceContext): Promise<void> {
    this._config = config;
    this.context = context;
    this._status = 'ready';
  }

  async healthCheck(): Promise<ServiceHealth> {
    return {
      status: this._status,
      lastCheck: new Date(),
    };
  }

  async shutdown(): Promise<void> {
    this._status = 'disabled';
  }

  getStatus(): ServiceStatus {
    return this._status;
  }

  protected log(level: 'debug' | 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>): void {
    if (this.context?.logger) {
      this.context.logger[level](message, meta);
    } else {
      console[level](`[${this.metadata.name}] ${message}`, meta);
    }
  }

  protected emit(event: string, data: any): void {
    if (this.context?.eventBus) {
      this.context.eventBus.emit(`service:${this.metadata.name}:${event}`, data);
    }
  }
}
