import React, { useState, useEffect } from 'react';
import { ProcessTransactionRequest, TransactionResult, PaymentMethod, Currency } from '../core/types';

export interface PaymentComponentProps {
  /** User ID making the payment */
  payerId: string;

  /** Recipient user ID or __SELF__ for platform */
  payeeId: string;

  /** Amount to charge */
  amount?: number;

  /** Currency */
  currency?: Currency;

  /** Callback when payment is successful */
  onSuccess?: (result: TransactionResult) => void;

  /** Callback when payment fails */
  onError?: (error: any) => void;

  /** Callback when payment is cancelled */
  onCancel?: () => void;

  /** Custom styling */
  className?: string;

  /** Show amount input */
  allowAmountInput?: boolean;

  /** Payment methods to show */
  availablePaymentMethods?: PaymentMethod[];
}

/**
 * Payment Component
 * Platform-agnostic payment UI for PWA
 */
export const PaymentComponent: React.FC<PaymentComponentProps> = ({
  payerId,
  payeeId,
  amount: initialAmount,
  currency = 'USD',
  onSuccess,
  onError,
  onCancel,
  className = '',
  allowAmountInput = false,
  availablePaymentMethods = ['credit_card', 'debit_card', 'paypal'],
}) => {
  const [amount, setAmount] = useState<number>(initialAmount || 0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(availablePaymentMethods[0]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialAmount) {
      setAmount(initialAmount);
    }
  }, [initialAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setProcessing(true);

    try {
      // In production, this would call the Payment Service API
      const request: ProcessTransactionRequest = {
        payerId,
        payeeId,
        amount,
        currency,
        paymentMethod,
        metadata: {
          description: `Payment from ${payerId} to ${payeeId}`,
          timestamp: new Date().toISOString(),
        },
      };

      // Mock API call - replace with actual service call
      const result = await mockProcessPayment(request);

      if (result.success) {
        onSuccess?.(result);
      } else {
        setError(result.error?.message || 'Payment failed');
        onError?.(result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      onError?.(err);
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(value);
  };

  const getPaymentMethodLabel = (method: PaymentMethod): string => {
    const labels: Record<PaymentMethod, string> = {
      credit_card: 'Credit Card',
      debit_card: 'Debit Card',
      bank_transfer: 'Bank Transfer',
      paypal: 'PayPal',
      stripe: 'Stripe',
      apple_pay: 'Apple Pay',
      google_pay: 'Google Pay',
    };
    return labels[method] || method;
  };

  return (
    <div className={`payment-component ${className}`}>
      <form onSubmit={handleSubmit} className="payment-form">
        <h2 className="payment-title">Complete Payment</h2>

        {error && (
          <div className="payment-error" role="alert">
            {error}
          </div>
        )}

        {/* Amount Section */}
        <div className="payment-section">
          <label htmlFor="amount" className="payment-label">
            Amount
          </label>
          {allowAmountInput ? (
            <input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
              disabled={processing}
              className="payment-input"
              required
            />
          ) : (
            <div className="payment-amount-display">
              {formatCurrency(amount)}
            </div>
          )}
        </div>

        {/* Payment Method Section */}
        <div className="payment-section">
          <label htmlFor="payment-method" className="payment-label">
            Payment Method
          </label>
          <select
            id="payment-method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            disabled={processing}
            className="payment-select"
            required
          >
            {availablePaymentMethods.map((method) => (
              <option key={method} value={method}>
                {getPaymentMethodLabel(method)}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Method Details */}
        {paymentMethod === 'credit_card' || paymentMethod === 'debit_card' ? (
          <div className="payment-card-details">
            <div className="payment-section">
              <label htmlFor="card-number" className="payment-label">
                Card Number
              </label>
              <input
                id="card-number"
                type="text"
                placeholder="1234 5678 9012 3456"
                disabled={processing}
                className="payment-input"
                required
              />
            </div>
            <div className="payment-row">
              <div className="payment-section">
                <label htmlFor="expiry" className="payment-label">
                  Expiry
                </label>
                <input
                  id="expiry"
                  type="text"
                  placeholder="MM/YY"
                  disabled={processing}
                  className="payment-input"
                  required
                />
              </div>
              <div className="payment-section">
                <label htmlFor="cvv" className="payment-label">
                  CVV
                </label>
                <input
                  id="cvv"
                  type="text"
                  placeholder="123"
                  disabled={processing}
                  className="payment-input"
                  required
                />
              </div>
            </div>
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="payment-actions">
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            className="payment-button payment-button-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={processing || amount <= 0}
            className="payment-button payment-button-primary"
          >
            {processing ? 'Processing...' : `Pay ${formatCurrency(amount)}`}
          </button>
        </div>
      </form>
    </div>
  );
};

/**
 * Mock payment processing for development
 * Replace with actual API call in production
 */
async function mockProcessPayment(
  request: ProcessTransactionRequest
): Promise<TransactionResult> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Simulate success
  return {
    success: true,
    transaction: {
      id: `tx_${Date.now()}`,
      payerId: request.payerId,
      payeeId: request.payeeId,
      amount: request.amount,
      currency: request.currency || 'USD',
      status: 'completed',
      paymentMethod: request.paymentMethod,
      metadata: request.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: new Date(),
    },
  };
}
