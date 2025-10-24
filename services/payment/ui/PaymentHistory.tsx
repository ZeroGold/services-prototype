import React, { useState, useEffect } from 'react';
import { Transaction, TransactionStatus } from '../core/types';

export interface PaymentHistoryProps {
  /** User ID to show history for */
  userId: string;

  /** Filter by status */
  statusFilter?: TransactionStatus;

  /** Number of transactions to show */
  limit?: number;

  /** Callback when transaction is clicked */
  onTransactionClick?: (transaction: Transaction) => void;

  /** Custom styling */
  className?: string;
}

/**
 * Payment History Component
 * Displays transaction history for a user
 */
export const PaymentHistory: React.FC<PaymentHistoryProps> = ({
  userId,
  statusFilter,
  limit = 10,
  onTransactionClick,
  className = '',
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTransactions();
  }, [userId, statusFilter, limit]);

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      // In production, call Payment Service API
      const data = await mockGetTransactions(userId, statusFilter, limit);
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getStatusBadgeClass = (status: TransactionStatus): string => {
    const statusClasses: Record<TransactionStatus, string> = {
      pending: 'status-pending',
      processing: 'status-processing',
      completed: 'status-completed',
      failed: 'status-failed',
      refunded: 'status-refunded',
      cancelled: 'status-cancelled',
    };
    return statusClasses[status] || '';
  };

  const getTransactionType = (tx: Transaction): 'sent' | 'received' => {
    return tx.payerId === userId ? 'sent' : 'received';
  };

  if (loading) {
    return (
      <div className={`payment-history ${className}`}>
        <div className="payment-history-loading">Loading transactions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`payment-history ${className}`}>
        <div className="payment-history-error">{error}</div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className={`payment-history ${className}`}>
        <div className="payment-history-empty">No transactions found</div>
      </div>
    );
  }

  return (
    <div className={`payment-history ${className}`}>
      <h2 className="payment-history-title">Transaction History</h2>
      <div className="payment-history-list">
        {transactions.map((transaction) => {
          const type = getTransactionType(transaction);
          return (
            <div
              key={transaction.id}
              className={`payment-history-item transaction-${type}`}
              onClick={() => onTransactionClick?.(transaction)}
            >
              <div className="transaction-main">
                <div className="transaction-info">
                  <div className="transaction-description">
                    {type === 'sent' ? 'Paid to' : 'Received from'}{' '}
                    {type === 'sent' ? transaction.payeeId : transaction.payerId}
                  </div>
                  <div className="transaction-date">
                    {formatDate(transaction.createdAt)}
                  </div>
                </div>
                <div className="transaction-details">
                  <div className={`transaction-amount transaction-amount-${type}`}>
                    {type === 'sent' ? '-' : '+'}
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </div>
                  <span className={`transaction-status ${getStatusBadgeClass(transaction.status)}`}>
                    {transaction.status}
                  </span>
                </div>
              </div>
              {transaction.metadata?.description && (
                <div className="transaction-meta">
                  {transaction.metadata.description}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Mock transaction data for development
 */
async function mockGetTransactions(
  userId: string,
  statusFilter?: TransactionStatus,
  limit: number = 10
): Promise<Transaction[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Generate mock transactions
  const mockTransactions: Transaction[] = [
    {
      id: 'tx_001',
      payerId: userId,
      payeeId: '__SELF__',
      amount: 49.99,
      currency: 'USD',
      status: 'completed',
      paymentMethod: 'credit_card',
      metadata: { description: 'Subscription payment' },
      createdAt: new Date(Date.now() - 86400000 * 2),
      updatedAt: new Date(Date.now() - 86400000 * 2),
      completedAt: new Date(Date.now() - 86400000 * 2),
    },
    {
      id: 'tx_002',
      payerId: 'user_456',
      payeeId: userId,
      amount: 25.00,
      currency: 'USD',
      status: 'completed',
      paymentMethod: 'paypal',
      metadata: { description: 'Payment for services' },
      createdAt: new Date(Date.now() - 86400000 * 5),
      updatedAt: new Date(Date.now() - 86400000 * 5),
      completedAt: new Date(Date.now() - 86400000 * 5),
    },
    {
      id: 'tx_003',
      payerId: userId,
      payeeId: 'user_789',
      amount: 100.00,
      currency: 'USD',
      status: 'pending',
      paymentMethod: 'bank_transfer',
      metadata: { description: 'Transfer to friend' },
      createdAt: new Date(Date.now() - 3600000),
      updatedAt: new Date(Date.now() - 3600000),
    },
  ];

  let filtered = mockTransactions;

  if (statusFilter) {
    filtered = filtered.filter((tx) => tx.status === statusFilter);
  }

  return filtered.slice(0, limit);
}
