import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PaymentComponent } from '@services/payment/ui';
import '@services/payment/ui/styles.css';
import './CheckoutPage.css';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');

  const plans = {
    monthly: {
      name: 'Monthly Premium',
      price: 9.99,
      interval: 'month',
      features: ['Advanced Analytics', 'Custom Workouts', 'Priority Support'],
    },
    yearly: {
      name: 'Yearly Premium',
      price: 99.99,
      interval: 'year',
      savings: 20.00,
      features: [
        'Advanced Analytics',
        'Custom Workouts',
        'Priority Support',
        '2 Months Free',
      ],
    },
  };

  const currentPlan = plans[selectedPlan];

  return (
    <div className="checkout-page">
      <h1>Subscribe to Premium</h1>

      <div className="plan-selection">
        <button
          className={`plan-button ${selectedPlan === 'monthly' ? 'active' : ''}`}
          onClick={() => setSelectedPlan('monthly')}
        >
          <div className="plan-name">Monthly</div>
          <div className="plan-price">${plans.monthly.price}/mo</div>
        </button>

        <button
          className={`plan-button ${selectedPlan === 'yearly' ? 'active' : ''}`}
          onClick={() => setSelectedPlan('yearly')}
        >
          <div className="plan-name">Yearly</div>
          <div className="plan-price">${plans.yearly.price}/yr</div>
          {plans.yearly.savings && (
            <div className="plan-savings">Save ${plans.yearly.savings}</div>
          )}
        </button>
      </div>

      <div className="plan-details">
        <h2>{currentPlan.name}</h2>
        <ul>
          {currentPlan.features.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
      </div>

      <div className="payment-section">
        <PaymentComponent
          payerId="demo-user-123" // In production, use actual user ID
          payeeId="__SELF__" // Platform account
          amount={currentPlan.price}
          currency="USD"
          onSuccess={(result) => {
            console.log('Payment successful!', result);
            alert('Subscription activated! Thank you for your purchase.');
            navigate('/transactions');
          }}
          onError={(error) => {
            console.error('Payment failed:', error);
            alert('Payment failed. Please try again.');
            setProcessing(false);
          }}
          onCancel={() => {
            navigate('/');
          }}
          availablePaymentMethods={['credit_card', 'debit_card', 'paypal']}
        />
      </div>

      <div className="checkout-info">
        <p className="security-note">
          <span className="icon">🔒</span>
          Secure payment processing
        </p>
        <p className="cancel-note">
          Cancel anytime. No hidden fees.
        </p>
      </div>
    </div>
  );
}
