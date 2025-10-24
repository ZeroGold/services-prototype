import React, { useState, useEffect } from 'react';
import { BalanceInfo } from '../core/types';

export interface BalanceDisplayProps {
  /** User ID to show balance for */
  userId: string;

  /** Show detailed balance breakdown */
  showDetails?: boolean;

  /** Refresh interval in milliseconds */
  refreshInterval?: number;

  /** Callback when balance is loaded */
  onBalanceLoaded?: (balance: BalanceInfo) => void;

  /** Custom styling */
  className?: string;
}

/**
 * Balance Display Component
 * Shows account balance with optional details
 */
export const BalanceDisplay: React.FC<BalanceDisplayProps> = ({
  userId,
  showDetails = false,
  refreshInterval,
  onBalanceLoaded,
  className = '',
}) => {
  const [balance, setBalance] = useState<BalanceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBalance();

    if (refreshInterval) {
      const interval = setInterval(loadBalance, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [userId, refreshInterval]);

  const loadBalance = async () => {
    setLoading(true);
    setError(null);

    try {
      // In production, call Payment Service API
      const data = await mockGetBalance(userId);
      setBalance(data);
      onBalanceLoaded?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load balance');
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

  if (loading && !balance) {
    return (
      <div className={`balance-display ${className}`}>
        <div className="balance-loading">Loading balance...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`balance-display ${className}`}>
        <div className="balance-error">{error}</div>
      </div>
    );
  }

  if (!balance) {
    return null;
  }

  return (
    <div className={`balance-display ${className}`}>
      <div className="balance-main">
        <div className="balance-label">Available Balance</div>
        <div className="balance-amount">
          {formatCurrency(balance.availableBalance, balance.currency)}
        </div>
      </div>

      {showDetails && (
        <div className="balance-details">
          <div className="balance-detail-item">
            <span className="balance-detail-label">Total Balance:</span>
            <span className="balance-detail-value">
              {formatCurrency(balance.balance, balance.currency)}
            </span>
          </div>
          <div className="balance-detail-item">
            <span className="balance-detail-label">Pending:</span>
            <span className="balance-detail-value">
              {formatCurrency(balance.pendingBalance, balance.currency)}
            </span>
          </div>
          <div className="balance-detail-item">
            <span className="balance-detail-label">Account ID:</span>
            <span className="balance-detail-value balance-account-id">
              {balance.accountId}
            </span>
          </div>
        </div>
      )}

      <button
        onClick={loadBalance}
        disabled={loading}
        className="balance-refresh-button"
        aria-label="Refresh balance"
      >
        {loading ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  );
};

/**
 * Mock balance data for development
 */
async function mockGetBalance(userId: string): Promise<BalanceInfo> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    accountId: `acc_${userId}`,
    ownerId: userId,
    balance: 523.45,
    currency: 'USD',
    availableBalance: 498.45,
    pendingBalance: 25.00,
  };
}
