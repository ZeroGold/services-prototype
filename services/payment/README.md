# Payment Service

A complete, cloneable payment service with transaction processing, ledger management, and platform-agnostic UI components.

## Features

- **Transaction Processing**: Handle payments between users and platform
- **Ledger System**: Complete audit trail and balance tracking
- **Payment Processor Integration**: Support for Stripe, PayPal, Square, and more
- **SELF Entity**: Built-in platform account management
- **Refund Support**: Full and partial refunds
- **Fraud Detection**: Configurable fraud prevention
- **PWA Components**: Ready-to-use React UI components
- **REST API**: Complete API layer for all operations

## Installation

### As a Cloneable Service

```bash
# Clone the service into your project
cp -r services/payment ./my-app/services/

# Install dependencies
npm install @shared/types @shared/config
```

### Configuration

Create a configuration file or set environment variables:

```typescript
import { PaymentService } from './services/payment';
import { configProvider } from '@shared/config';

const config = {
  processor: {
    provider: 'stripe', // or 'paypal', 'square', 'mock'
    apiKey: process.env.STRIPE_API_KEY,
    secretKey: process.env.STRIPE_SECRET_KEY,
    testMode: true,
  },
  defaultCurrency: 'USD',
  platformFeePercent: 2.9,
  minTransactionAmount: 0.5,
  maxTransactionAmount: 10000,
  refundsEnabled: true,
  fraudDetection: {
    enabled: true,
    maxDailyAmount: 5000,
    maxTransactionCount: 20,
  },
};
```

## Database Setup

### Supabase

1. Create a new Supabase project
2. Run the schema:

```bash
psql $DATABASE_URL < services/payment/database/schema.sql
```

Or use Supabase SQL editor to paste the contents of `database/schema.sql`.

### Environment Variables

```env
DATABASE_URL=postgresql://[user]:[password]@db.[project-ref].supabase.co:5432/postgres
SUPABASE_KEY=[your-anon-key]
STRIPE_API_KEY=[your-stripe-key]
STRIPE_SECRET_KEY=[your-stripe-secret]
```

## Usage

### Initialize the Service

```typescript
import { PaymentService } from './services/payment';
import { ServiceContext } from '@shared/types';

const paymentService = new PaymentService();

const context: ServiceContext = {
  environment: 'production',
  platform: 'pwa',
  database: databaseConnection,
  logger: logger,
};

await paymentService.initialize(config, context);
```

### Process a Transaction

```typescript
const result = await paymentService.processTransaction({
  payerId: 'user_123',
  payeeId: '__SELF__', // Platform account
  amount: 49.99,
  currency: 'USD',
  paymentMethod: 'credit_card',
  metadata: {
    description: 'Subscription payment',
    orderId: 'order_456',
  },
});

if (result.success) {
  console.log('Transaction completed:', result.transaction);
} else {
  console.error('Transaction failed:', result.error);
}
```

### Process a Refund

```typescript
const refund = await paymentService.processRefund({
  transactionId: 'tx_123',
  amount: 49.99, // Full refund, or partial amount
  reason: 'Customer request',
});
```

### Check Balance

```typescript
const balance = await paymentService.getBalance('user_123');
console.log('Available balance:', balance.availableBalance);
console.log('Pending:', balance.pendingBalance);
```

### Get Transaction History

```typescript
const transactions = await paymentService.getTransactions('user_123', {
  status: 'completed',
  limit: 10,
  offset: 0,
});
```

## UI Components

### PaymentComponent

```tsx
import { PaymentComponent } from './services/payment/ui';
import './services/payment/ui/styles.css';

function CheckoutPage() {
  return (
    <PaymentComponent
      payerId={currentUser.id}
      payeeId="__SELF__"
      amount={49.99}
      currency="USD"
      onSuccess={(result) => {
        console.log('Payment successful!', result);
      }}
      onError={(error) => {
        console.error('Payment failed:', error);
      }}
      availablePaymentMethods={['credit_card', 'paypal']}
    />
  );
}
```

### BalanceDisplay

```tsx
import { BalanceDisplay } from './services/payment/ui';

function DashboardPage() {
  return (
    <BalanceDisplay
      userId={currentUser.id}
      showDetails={true}
      refreshInterval={30000} // Refresh every 30 seconds
    />
  );
}
```

### PaymentHistory

```tsx
import { PaymentHistory } from './services/payment/ui';

function TransactionsPage() {
  return (
    <PaymentHistory
      userId={currentUser.id}
      limit={20}
      onTransactionClick={(tx) => {
        console.log('Transaction details:', tx);
      }}
    />
  );
}
```

## API Endpoints

### POST /api/payment/transactions
Create a new transaction

```json
{
  "payerId": "user_123",
  "payeeId": "__SELF__",
  "amount": 49.99,
  "currency": "USD",
  "paymentMethod": "credit_card",
  "metadata": {
    "description": "Subscription payment"
  }
}
```

### GET /api/payment/transactions/:id
Get transaction by ID

### GET /api/payment/transactions
Get all transactions for current user

Query params: `status`, `limit`, `offset`

### POST /api/payment/refunds
Process a refund

```json
{
  "transactionId": "tx_123",
  "amount": 49.99,
  "reason": "Customer request"
}
```

### GET /api/payment/balance
Get current user's balance

### GET /api/payment/health
Service health check

## SELF Entity

The `__SELF__` entity represents the platform/company account:

### Customer Paying Platform
```typescript
{
  payerId: 'user_123',
  payeeId: '__SELF__',
  amount: 49.99
}
```

### Platform Paying Customer (Refund/Payout)
```typescript
{
  payerId: '__SELF__',
  payeeId: 'user_123',
  amount: 49.99
}
```

## Payment Processors

### Stripe

```typescript
{
  processor: {
    provider: 'stripe',
    apiKey: process.env.STRIPE_API_KEY,
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    testMode: false
  }
}
```

### PayPal

```typescript
{
  processor: {
    provider: 'paypal',
    apiKey: process.env.PAYPAL_CLIENT_ID,
    secretKey: process.env.PAYPAL_SECRET,
    testMode: false
  }
}
```

### Mock (Testing)

```typescript
{
  processor: {
    provider: 'mock',
    apiKey: 'test',
    testMode: true
  }
}
```

## Security

### Authentication
All API endpoints require user authentication. Implement your auth middleware:

```typescript
app.use('/api/payment', authMiddleware);
```

### Authorization
- Users can only create transactions as payer
- Users can only view their own transactions
- Only payee can issue refunds

### Rate Limiting
Configure rate limiting in your service config:

```typescript
{
  fraudDetection: {
    enabled: true,
    maxDailyAmount: 5000,
    maxTransactionCount: 20
  }
}
```

## Customization

### Custom Payment Processor

Implement the `IPaymentProcessor` interface:

```typescript
import { IPaymentProcessor } from './services/payment/core/types';

class CustomProcessor implements IPaymentProcessor {
  async processPayment(...) {
    // Your implementation
  }

  async processRefund(...) {
    // Your implementation
  }

  async verifyPayment(...) {
    // Your implementation
  }
}
```

### Custom UI Styling

Override the default styles in `ui/styles.css` or add your own:

```css
.payment-component {
  /* Your custom styles */
}
```

## Events

The service emits events that you can listen to:

```typescript
paymentService.on('transaction:completed', (transaction) => {
  console.log('Transaction completed:', transaction);
});

paymentService.on('refund:completed', (refund) => {
  console.log('Refund processed:', refund);
});
```

## Testing

```typescript
import { PaymentService } from './services/payment';

describe('Payment Service', () => {
  let service: PaymentService;

  beforeAll(async () => {
    service = new PaymentService();
    await service.initialize({
      processor: {
        provider: 'mock',
        apiKey: 'test',
        testMode: true,
      },
      defaultCurrency: 'USD',
    });
  });

  test('process transaction', async () => {
    const result = await service.processTransaction({
      payerId: 'test_user',
      payeeId: '__SELF__',
      amount: 10.00,
      currency: 'USD',
    });

    expect(result.success).toBe(true);
    expect(result.transaction?.status).toBe('completed');
  });
});
```

## Cloning Guide

To clone this service into a new application:

1. Copy the service directory
2. Install dependencies
3. Set up database schema
4. Configure environment variables
5. Initialize the service
6. Integrate UI components
7. Set up API routes
8. Add authentication/authorization

See [CLONING.md](./CLONING.md) for detailed instructions.

## License

MIT
