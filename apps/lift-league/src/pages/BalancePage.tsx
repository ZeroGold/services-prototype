import React from 'react';
import { BalanceDisplay } from '@services/payment/ui';
import '@services/payment/ui/styles.css';
import './BalancePage.css';

export default function BalancePage() {
  return (
    <div className="balance-page">
      <h1>Account Balance</h1>

      <div className="balance-container">
        <BalanceDisplay
          userId="demo-user-123"
          showDetails={true}
          refreshInterval={30000}
          onBalanceLoaded={(balance) => {
            console.log('Balance loaded:', balance);
          }}
        />
      </div>

      <div className="balance-info">
        <h2>About Your Balance</h2>
        <div className="info-section">
          <h3>Total Balance</h3>
          <p>
            This is the total amount in your account, including pending
            transactions.
          </p>
        </div>

        <div className="info-section">
          <h3>Available Balance</h3>
          <p>
            This is the amount you can currently withdraw or use for purchases,
            excluding pending transactions.
          </p>
        </div>

        <div className="info-section">
          <h3>Pending Balance</h3>
          <p>
            This represents transactions that are being processed and are not yet
            available for use.
          </p>
        </div>
      </div>

      <div className="balance-actions">
        <button className="action-button">Add Funds</button>
        <button className="action-button">Withdraw</button>
        <button className="action-button">Transfer</button>
      </div>
    </div>
  );
}
