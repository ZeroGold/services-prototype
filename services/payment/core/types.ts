/**
 * Payment Service Types
 */

export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';

export type TransactionStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'cancelled';

export type AccountType = 'user' | 'platform' | 'escrow' | 'merchant';

export type PaymentMethod =
  | 'credit_card'
  | 'debit_card'
  | 'bank_transfer'
  | 'paypal'
  | 'stripe'
  | 'apple_pay'
  | 'google_pay';

/**
 * Special entity identifier for platform/company account
 */
export const SELF_ENTITY = '__SELF__';

/**
 * Transaction metadata for additional context
 */
export interface TransactionMetadata {
  description?: string;
  orderId?: string;
  invoiceId?: string;
  category?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

/**
 * Core transaction object
 */
export interface Transaction {
  id: string;
  payerId: string;
  payeeId: string;
  amount: number;
  currency: Currency;
  status: TransactionStatus;
  paymentMethod?: PaymentMethod;
  processorReference?: string;
  metadata?: TransactionMetadata;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

/**
 * Account/Ledger entry
 */
export interface Account {
  id: string;
  ownerId: string;
  type: AccountType;
  balance: number;
  currency: Currency;
  status: 'active' | 'suspended' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Payment processor configuration
 */
export interface PaymentProcessorConfig {
  provider: 'stripe' | 'paypal' | 'square' | 'mock';
  apiKey: string;
  secretKey?: string;
  webhookSecret?: string;
  testMode?: boolean;
}

/**
 * Payment Service configuration
 */
export interface PaymentServiceConfig {
  /** Payment processor settings */
  processor: PaymentProcessorConfig;

  /** Default currency */
  defaultCurrency: Currency;

  /** Platform fee percentage (0-100) */
  platformFeePercent?: number;

  /** Minimum transaction amount */
  minTransactionAmount?: number;

  /** Maximum transaction amount */
  maxTransactionAmount?: number;

  /** Enable refunds */
  refundsEnabled?: boolean;

  /** Enable escrow */
  escrowEnabled?: boolean;

  /** Fraud detection settings */
  fraudDetection?: {
    enabled: boolean;
    maxDailyAmount?: number;
    maxTransactionCount?: number;
  };
}

/**
 * Transaction request parameters
 */
export interface ProcessTransactionRequest {
  payerId: string;
  payeeId: string;
  amount: number;
  currency?: Currency;
  paymentMethod?: PaymentMethod;
  metadata?: TransactionMetadata;
  idempotencyKey?: string;
}

/**
 * Transaction result
 */
export interface TransactionResult {
  success: boolean;
  transaction?: Transaction;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Refund request
 */
export interface RefundRequest {
  transactionId: string;
  amount?: number; // Partial refund if specified
  reason?: string;
}

/**
 * Balance query result
 */
export interface BalanceInfo {
  accountId: string;
  ownerId: string;
  balance: number;
  currency: Currency;
  availableBalance: number; // Excluding pending transactions
  pendingBalance: number;
}

/**
 * Payment processor interface
 */
export interface IPaymentProcessor {
  /** Process a payment */
  processPayment(
    amount: number,
    currency: Currency,
    paymentMethod: PaymentMethod,
    metadata?: Record<string, unknown>
  ): Promise<{ success: boolean; reference?: string; error?: string }>;

  /** Process a refund */
  processRefund(
    reference: string,
    amount: number,
    currency: Currency
  ): Promise<{ success: boolean; error?: string }>;

  /** Verify a payment */
  verifyPayment(reference: string): Promise<{ verified: boolean; status: string }>;
}
