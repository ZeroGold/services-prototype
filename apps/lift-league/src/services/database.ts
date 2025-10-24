/**
 * Database Connection
 * Mock database for development
 */

import { DatabaseConnection } from '@shared/types';
import { DatabaseConfig } from '@shared/types/config';

/**
 * Create database connection
 */
export async function createDatabaseConnection(
  config: DatabaseConfig
): Promise<DatabaseConnection> {
  console.log('Creating database connection:', config.provider);

  // For development, use a mock implementation
  // In production, connect to actual database
  return new MockDatabaseConnection(config);
}

/**
 * Mock Database Connection for Development
 */
class MockDatabaseConnection implements DatabaseConnection {
  private storage: Map<string, any[]> = new Map();

  constructor(private config: DatabaseConfig) {
    this.initializeTables();
  }

  get host(): string {
    return 'mock-db';
  }

  get database(): string {
    return 'lift_league_dev';
  }

  async connect(): Promise<void> {
    console.log('Connected to mock database');
  }

  async disconnect(): Promise<void> {
    console.log('Disconnected from mock database');
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T> {
    console.log('Executing query:', sql, params);

    // Simple mock implementation
    // In production, use actual database driver

    // Handle SELECT queries
    if (sql.toUpperCase().includes('SELECT')) {
      const table = this.extractTableName(sql);
      return (this.storage.get(table) || []) as T;
    }

    // Handle INSERT queries
    if (sql.toUpperCase().includes('INSERT')) {
      const table = this.extractTableName(sql);
      const rows = this.storage.get(table) || [];
      const newRow = this.createRowFromParams(sql, params);
      rows.push(newRow);
      this.storage.set(table, rows);
      return newRow as T;
    }

    // Handle UPDATE queries
    if (sql.toUpperCase().includes('UPDATE')) {
      const table = this.extractTableName(sql);
      const rows = this.storage.get(table) || [];
      // Simple update - update first matching row
      if (rows.length > 0 && params) {
        Object.assign(rows[0], this.createUpdateFromParams(sql, params));
      }
      return rows[0] as T;
    }

    return [] as T;
  }

  private initializeTables(): void {
    this.storage.set('accounts', []);
    this.storage.set('transactions', []);
  }

  private extractTableName(sql: string): string {
    const match = sql.match(/(?:FROM|INTO|UPDATE)\s+(\w+)/i);
    return match ? match[1] : 'unknown';
  }

  private createRowFromParams(sql: string, params?: any[]): any {
    if (!params) return {};

    // Parse column names from INSERT statement
    const columnsMatch = sql.match(/\((.*?)\)/);
    if (!columnsMatch) return {};

    const columns = columnsMatch[1].split(',').map(c => c.trim());
    const row: any = {};

    columns.forEach((col, i) => {
      const key = col.replace(/"/g, '');
      row[key] = params[i];
    });

    return row;
  }

  private createUpdateFromParams(sql: string, params?: any[]): any {
    if (!params) return {};

    // Simple update object
    return {
      updated_at: new Date(),
    };
  }
}
