import { BaseService, ServiceMetadata, ServiceContext } from '@shared/types';
import {
  PaymentServiceConfig,
  ProcessTransactionRequest,
  TransactionResult,
  Transaction,
  TransactionStatus,
  RefundRequest,
  BalanceInfo,
  SELF_ENTITY,
  IPaymentProcessor,
  Currency,
} from './types';
import { LedgerManager } from './LedgerManager';
import { PaymentProcessor } from './PaymentProcessor';

/**
 * Payment Service
 * Core cloneable service for payment processing and ledger management
 */
export class PaymentService extends BaseService<PaymentServiceConfig> {
  readonly metadata: ServiceMetadata = {
    name: 'payment',
    version: '0.1.0',
    description: 'Payment processing service with ledger system',
    platforms: ['pwa', 'mobile', 'web'],
  };

  private ledger?: LedgerManager;
  private processor?: IPaymentProcessor;

  async initialize(config: PaymentServiceConfig, context?: ServiceContext): Promise<void> {
    await super.initialize(config, context);

    if (!context?.database) {
      throw new Error('Database connection required for Payment Service');
    }

    // Initialize ledger manager
    this.ledger = new LedgerManager(context.database);
    await this.ledger.initialize();

    // Initialize payment processor
    this.processor = new PaymentProcessor(config.processor);

    this.log('info', 'Payment Service initialized', {
      processor: config.processor.provider,
      currency: config.defaultCurrency,
    });

    this._status = 'ready';
  }

  /**
   * Process a transaction
   * Main function for handling payments between entities
   */
  async processTransaction(request: ProcessTransactionRequest): Promise<TransactionResult> {
    try {
      this.validateTransaction(request);

      const { payerId, payeeId, amount, currency, paymentMethod, metadata, idempotencyKey } = request;

      // Check for duplicate transaction (idempotency)
      if (idempotencyKey) {
        const existing = await this.ledger!.findByIdempotencyKey(idempotencyKey);
        if (existing) {
          return { success: true, transaction: existing };
        }
      }

      // Create pending transaction
      const transaction = await this.ledger!.createTransaction({
        payerId,
        payeeId,
        amount,
        currency: currency || this.config.defaultCurrency,
        status: 'pending',
        paymentMethod,
        metadata: {
          ...metadata,
          idempotencyKey,
        },
      });

      this.log('info', 'Transaction created', { transactionId: transaction.id, amount });

      // Determine if this requires payment processing
      const requiresProcessing = this.requiresPaymentProcessing(payerId, payeeId);

      if (requiresProcessing && paymentMethod) {
        // Process payment through payment processor
        await this.ledger!.updateTransactionStatus(transaction.id, 'processing');

        const result = await this.processor!.processPayment(
          amount,
          transaction.currency,
          paymentMethod,
          {
            transactionId: transaction.id,
            payerId,
            payeeId,
          }
        );

        if (!result.success) {
          await this.ledger!.updateTransactionStatus(transaction.id, 'failed');
          return {
            success: false,
            error: {
              code: 'PAYMENT_FAILED',
              message: result.error || 'Payment processing failed',
            },
          };
        }

        // Update with processor reference
        await this.ledger!.updateTransaction(transaction.id, {
          processorReference: result.reference,
        });
      }

      // Update account balances
      await this.ledger!.updateBalances(payerId, payeeId, amount, transaction.currency);

      // Mark transaction as completed
      const completedTransaction = await this.ledger!.updateTransactionStatus(
        transaction.id,
        'completed'
      );

      this.emit('transaction:completed', completedTransaction);
      this.log('info', 'Transaction completed', { transactionId: transaction.id });

      return { success: true, transaction: completedTransaction };
    } catch (error) {
      this.log('error', 'Transaction failed', { error });
      return {
        success: false,
        error: {
          code: 'TRANSACTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Process a refund
   */
  async processRefund(request: RefundRequest): Promise<TransactionResult> {
    try {
      const { transactionId, amount, reason } = request;

      if (!this.config.refundsEnabled) {
        return {
          success: false,
          error: {
            code: 'REFUNDS_DISABLED',
            message: 'Refunds are not enabled',
          },
        };
      }

      // Get original transaction
      const originalTx = await this.ledger!.getTransaction(transactionId);
      if (!originalTx) {
        return {
          success: false,
          error: {
            code: 'TRANSACTION_NOT_FOUND',
            message: 'Original transaction not found',
          },
        };
      }

      if (originalTx.status !== 'completed') {
        return {
          success: false,
          error: {
            code: 'INVALID_TRANSACTION_STATUS',
            message: 'Can only refund completed transactions',
          },
        };
      }

      const refundAmount = amount || originalTx.amount;

      // Create refund transaction (reverse the original)
      const refundTransaction = await this.ledger!.createTransaction({
        payerId: originalTx.payeeId, // Reverse
        payeeId: originalTx.payerId, // Reverse
        amount: refundAmount,
        currency: originalTx.currency,
        status: 'processing',
        metadata: {
          description: `Refund for transaction ${transactionId}`,
          reason,
          originalTransactionId: transactionId,
        },
      });

      // Process refund with payment processor if needed
      if (originalTx.processorReference) {
        const result = await this.processor!.processRefund(
          originalTx.processorReference,
          refundAmount,
          originalTx.currency
        );

        if (!result.success) {
          await this.ledger!.updateTransactionStatus(refundTransaction.id, 'failed');
          return {
            success: false,
            error: {
              code: 'REFUND_FAILED',
              message: result.error || 'Refund processing failed',
            },
          };
        }
      }

      // Update balances
      await this.ledger!.updateBalances(
        refundTransaction.payerId,
        refundTransaction.payeeId,
        refundAmount,
        originalTx.currency
      );

      // Mark original transaction as refunded
      await this.ledger!.updateTransactionStatus(originalTx.id, 'refunded');

      // Complete refund transaction
      const completedRefund = await this.ledger!.updateTransactionStatus(
        refundTransaction.id,
        'completed'
      );

      this.emit('refund:completed', completedRefund);

      return { success: true, transaction: completedRefund };
    } catch (error) {
      this.log('error', 'Refund failed', { error });
      return {
        success: false,
        error: {
          code: 'REFUND_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Get account balance
   */
  async getBalance(ownerId: string): Promise<BalanceInfo | null> {
    return this.ledger!.getBalance(ownerId);
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(transactionId: string): Promise<Transaction | null> {
    return this.ledger!.getTransaction(transactionId);
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
    return this.ledger!.getTransactions(ownerId, options);
  }

  /**
   * Validate transaction request
   */
  private validateTransaction(request: ProcessTransactionRequest): void {
    const { amount, payerId, payeeId } = request;

    if (amount <= 0) {
      throw new Error('Transaction amount must be positive');
    }

    if (this.config.minTransactionAmount && amount < this.config.minTransactionAmount) {
      throw new Error(`Transaction amount below minimum: ${this.config.minTransactionAmount}`);
    }

    if (this.config.maxTransactionAmount && amount > this.config.maxTransactionAmount) {
      throw new Error(`Transaction amount exceeds maximum: ${this.config.maxTransactionAmount}`);
    }

    if (payerId === payeeId) {
      throw new Error('Payer and payee cannot be the same');
    }

    if (!payerId || !payeeId) {
      throw new Error('Payer and payee are required');
    }
  }

  /**
   * Determine if payment processing is required
   */
  private requiresPaymentProcessing(payerId: string, payeeId: string): boolean {
    // If paying FROM the platform, no external processing needed (payout)
    if (payerId === SELF_ENTITY) {
      return false;
    }

    // If paying TO the platform, external processing needed (charge)
    if (payeeId === SELF_ENTITY) {
      return true;
    }

    // For user-to-user, depends on implementation (could use escrow)
    return true;
  }
}
