import React from 'react';
import { PaymentHistory } from '@services/payment/ui';
import { Transaction } from '@services/payment/core/types';
import '@services/payment/ui/styles.css';
import './TransactionsPage.css';

export default function TransactionsPage() {
  const handleTransactionClick = (transaction: Transaction) => {
    console.log('Transaction clicked:', transaction);
    // In production, navigate to transaction detail page or show modal
    alert(`Transaction: ${transaction.id}\nAmount: $${transaction.amount}\nStatus: ${transaction.status}`);
  };

  return (
    <div className="transactions-page">
      <h1>Transaction History</h1>

      <div className="transactions-container">
        <PaymentHistory
          userId="demo-user-123"
          limit={20}
          onTransactionClick={handleTransactionClick}
        />
      </div>

      <div className="transactions-info">
        <h2>Understanding Your Transactions</h2>
        <div className="status-guide">
          <div className="status-item">
            <span className="status-badge status-completed">Completed</span>
            <p>Transaction successfully processed</p>
          </div>
          <div className="status-item">
            <span className="status-badge status-pending">Pending</span>
            <p>Transaction is being processed</p>
          </div>
          <div className="status-item">
            <span className="status-badge status-failed">Failed</span>
            <p>Transaction could not be completed</p>
          </div>
          <div className="status-item">
            <span className="status-badge status-refunded">Refunded</span>
            <p>Transaction has been refunded</p>
          </div>
        </div>
      </div>
    </div>
  );
}
