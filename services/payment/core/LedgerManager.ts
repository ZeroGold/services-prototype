import { DatabaseConnection } from '@shared/types';
import {
  Transaction,
  Account,
  TransactionStatus,
  Currency,
  AccountType,
  BalanceInfo,
  SELF_ENTITY,
} from './types';

/**
 * Ledger Manager
 * Handles all database operations for transactions and accounts
 */
export class LedgerManager {
  constructor(private db: DatabaseConnection) {}

  async initialize(): Promise<void> {
    // Ensure database connection is ready
    // In production, run migrations here
    await this.db.connect();
  }

  /**
   * Create a new transaction
   */
  async createTransaction(data: {
    payerId: string;
    payeeId: string;
    amount: number;
    currency: Currency;
    status: TransactionStatus;
    paymentMethod?: string;
    metadata?: any;
  }): Promise<Transaction> {
    const id = this.generateId();
    const now = new Date();

    const transaction: Transaction = {
      id,
      payerId: data.payerId,
      payeeId: data.payeeId,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      paymentMethod: data.paymentMethod as any,
      metadata: data.metadata,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.query(
      `INSERT INTO transactions (
        id, payer_id, payee_id, amount, currency, status,
        payment_method, metadata, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        transaction.id,
        transaction.payerId,
        transaction.payeeId,
        transaction.amount,
        transaction.currency,
        transaction.status,
        transaction.paymentMethod,
        JSON.stringify(transaction.metadata || {}),
        transaction.createdAt,
        transaction.updatedAt,
      ]
    );

    return transaction;
  }

  /**
   * Update transaction
   */
  async updateTransaction(
    transactionId: string,
    updates: Partial<Transaction>
  ): Promise<Transaction> {
    const transaction = await this.getTransaction(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    const updated = { ...transaction, ...updates, updatedAt: new Date() };

    await this.db.query(
      `UPDATE transactions SET
        status = $1,
        processor_reference = $2,
        metadata = $3,
        updated_at = $4,
        completed_at = $5
      WHERE id = $6`,
      [
        updated.status,
        updated.processorReference,
        JSON.stringify(updated.metadata || {}),
        updated.updatedAt,
        updated.completedAt,
        transactionId,
      ]
    );

    return updated;
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(
    transactionId: string,
    status: TransactionStatus
  ): Promise<Transaction> {
    const updates: Partial<Transaction> = { status };
    if (status === 'completed') {
      updates.completedAt = new Date();
    }
    return this.updateTransaction(transactionId, updates);
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(transactionId: string): Promise<Transaction | null> {
    const result = await this.db.query<Transaction>(
      'SELECT * FROM transactions WHERE id = $1',
      [transactionId]
    );

    if (!result || (Array.isArray(result) && result.length === 0)) {
      return null;
    }

    const row = Array.isArray(result) ? result[0] : result;
    return this.mapRowToTransaction(row);
  }

  /**
   * Find transaction by idempotency key
   */
  async findByIdempotencyKey(key: string): Promise<Transaction | null> {
    const result = await this.db.query<Transaction>(
      `SELECT * FROM transactions WHERE metadata->>'idempotencyKey' = $1`,
      [key]
    );

    if (!result || (Array.isArray(result) && result.length === 0)) {
      return null;
    }

    const row = Array.isArray(result) ? result[0] : result;
    return this.mapRowToTransaction(row);
  }

  /**
   * Get transactions for an owner
   */
  async getTransactions(
    ownerId: string,
    options?: {
      status?: TransactionStatus;
      limit?: number;
      offset?: number;
    }
  ): Promise<Transaction[]> {
    let query = `
      SELECT * FROM transactions
      WHERE payer_id = $1 OR payee_id = $1
    `;

    const params: any[] = [ownerId];

    if (options?.status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(options.status);
    }

    query += ` ORDER BY created_at DESC`;

    if (options?.limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(options.limit);
    }

    if (options?.offset) {
      query += ` OFFSET $${params.length + 1}`;
      params.push(options.offset);
    }

    const result = await this.db.query<Transaction>(query, params);

    if (!result || !Array.isArray(result)) {
      return [];
    }

    return result.map(row => this.mapRowToTransaction(row));
  }

  /**
   * Update account balances
   */
  async updateBalances(
    payerId: string,
    payeeId: string,
    amount: number,
    currency: Currency
  ): Promise<void> {
    // Ensure accounts exist
    await this.ensureAccount(payerId, currency);
    await this.ensureAccount(payeeId, currency);

    // Deduct from payer
    if (payerId !== SELF_ENTITY) {
      await this.db.query(
        `UPDATE accounts SET balance = balance - $1, updated_at = $2 WHERE owner_id = $3 AND currency = $4`,
        [amount, new Date(), payerId, currency]
      );
    }

    // Add to payee
    if (payeeId !== SELF_ENTITY) {
      await this.db.query(
        `UPDATE accounts SET balance = balance + $1, updated_at = $2 WHERE owner_id = $3 AND currency = $4`,
        [amount, new Date(), payeeId, currency]
      );
    }
  }

  /**
   * Get account balance
   */
  async getBalance(ownerId: string): Promise<BalanceInfo | null> {
    const result = await this.db.query<Account>(
      'SELECT * FROM accounts WHERE owner_id = $1',
      [ownerId]
    );

    if (!result || (Array.isArray(result) && result.length === 0)) {
      return null;
    }

    const account = Array.isArray(result) ? result[0] : result;

    // Calculate pending balance
    const pendingResult = await this.db.query<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
       WHERE (payer_id = $1 OR payee_id = $1) AND status IN ('pending', 'processing')`,
      [ownerId]
    );

    const pendingBalance = Array.isArray(pendingResult)
      ? pendingResult[0]?.total || 0
      : pendingResult?.total || 0;

    return {
      accountId: (account as any).id,
      ownerId: (account as any).owner_id,
      balance: (account as any).balance,
      currency: (account as any).currency,
      availableBalance: (account as any).balance - pendingBalance,
      pendingBalance,
    };
  }

  /**
   * Ensure account exists
   */
  private async ensureAccount(ownerId: string, currency: Currency): Promise<void> {
    // Skip for SELF entity
    if (ownerId === SELF_ENTITY) {
      return;
    }

    const existing = await this.db.query(
      'SELECT id FROM accounts WHERE owner_id = $1 AND currency = $2',
      [ownerId, currency]
    );

    if (!existing || (Array.isArray(existing) && existing.length === 0)) {
      const id = this.generateId();
      const now = new Date();
      await this.db.query(
        `INSERT INTO accounts (id, owner_id, type, balance, currency, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, ownerId, 'user', 0, currency, 'active', now, now]
      );
    }
  }

  /**
   * Map database row to Transaction object
   */
  private mapRowToTransaction(row: any): Transaction {
    return {
      id: row.id,
      payerId: row.payer_id,
      payeeId: row.payee_id,
      amount: parseFloat(row.amount),
      currency: row.currency,
      status: row.status,
      paymentMethod: row.payment_method,
      processorReference: row.processor_reference,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    };
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
