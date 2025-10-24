# Cloning the Payment Service

This guide explains how to clone and integrate the Payment Service into your application.

## What is a Cloneable Service?

A cloneable service is a self-contained module that can be copied into any application and configured to work with your specific needs. No need to install it as a package - just copy the files and configure.

## Quick Start

### Step 1: Copy the Service

```bash
# From the services-prototype repository root
cp -r services/payment /path/to/your/app/services/

# Also copy shared dependencies
cp -r shared/types /path/to/your/app/shared/
cp -r shared/config /path/to/your/app/shared/
```

### Step 2: Install Dependencies

```bash
cd /path/to/your/app
npm install
```

The service requires:
- TypeScript
- React (for UI components)
- PostgreSQL-compatible database

### Step 3: Set Up Database

Run the database schema:

```bash
# For Supabase
psql $DATABASE_URL < services/payment/database/schema.sql

# Or use Supabase dashboard SQL editor
# Copy contents of database/schema.sql and execute
```

### Step 4: Configure Environment

Create or update `.env`:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname
DB_PROVIDER=supabase
SUPABASE_KEY=your-supabase-anon-key

# Payment Processor
STRIPE_API_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key

# App Config
APP_NAME=my-app
NODE_ENV=development
PLATFORM=pwa
```

### Step 5: Initialize in Your App

```typescript
// src/services/index.ts
import { PaymentService } from './payment';
import { configProvider } from '../shared/config';
import { databaseConnection } from './database';

// Load configuration
await configProvider.load();

// Initialize Payment Service
export const paymentService = new PaymentService();

await paymentService.initialize(
  {
    processor: {
      provider: 'stripe',
      apiKey: process.env.STRIPE_API_KEY!,
      secretKey: process.env.STRIPE_SECRET_KEY!,
      testMode: process.env.NODE_ENV !== 'production',
    },
    defaultCurrency: 'USD',
    platformFeePercent: 2.9,
    refundsEnabled: true,
  },
  {
    environment: process.env.NODE_ENV as any,
    platform: 'pwa',
    database: databaseConnection,
  }
);
```

### Step 6: Add API Routes

#### Express Example

```typescript
// src/api/payment.ts
import express from 'express';
import { PaymentApiRoutes } from './services/payment/api';
import { paymentService } from './services';
import { authMiddleware } from './middleware/auth';

const router = express.Router();
const paymentApi = new PaymentApiRoutes(paymentService);

// Apply authentication
router.use(authMiddleware);

// Create transaction
router.post('/transactions', async (req, res) => {
  const result = await paymentApi.createTransaction({
    body: req.body,
    params: req.params,
    query: req.query,
    user: req.user,
  });
  res.status(result.status).json(result.json);
});

// Get transactions
router.get('/transactions', async (req, res) => {
  const result = await paymentApi.getTransactions({
    body: req.body,
    params: req.params,
    query: req.query,
    user: req.user,
  });
  res.status(result.status).json(result.json);
});

// Get balance
router.get('/balance', async (req, res) => {
  const result = await paymentApi.getBalance({
    body: req.body,
    params: req.params,
    query: req.query,
    user: req.user,
  });
  res.status(result.status).json(result.json);
});

export default router;
```

#### Next.js Example

```typescript
// app/api/payment/transactions/route.ts
import { NextRequest } from 'next/server';
import { PaymentApiRoutes } from '@/services/payment/api';
import { paymentService } from '@/services';
import { getCurrentUser } from '@/lib/auth';

const paymentApi = new PaymentApiRoutes(paymentService);

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  const body = await req.json();

  const result = await paymentApi.createTransaction({
    body,
    params: {},
    query: {},
    user,
  });

  return Response.json(result.json, { status: result.status });
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  const url = new URL(req.url);
  const query = Object.fromEntries(url.searchParams);

  const result = await paymentApi.getTransactions({
    body: {},
    params: {},
    query,
    user,
  });

  return Response.json(result.json, { status: result.status });
}
```

### Step 7: Add UI Components

```tsx
// src/pages/Checkout.tsx
import React from 'react';
import { PaymentComponent } from '../services/payment/ui';
import '../services/payment/ui/styles.css';

export function CheckoutPage() {
  const currentUser = useCurrentUser();

  return (
    <div>
      <h1>Checkout</h1>
      <PaymentComponent
        payerId={currentUser.id}
        payeeId="__SELF__"
        amount={49.99}
        currency="USD"
        onSuccess={(result) => {
          console.log('Payment successful!');
          // Redirect to success page
        }}
        onError={(error) => {
          console.error('Payment failed:', error);
          // Show error message
        }}
      />
    </div>
  );
}
```

## Customization

### Custom Processor

Create your own payment processor:

```typescript
// src/services/payment-processors/CustomProcessor.ts
import { IPaymentProcessor, Currency, PaymentMethod } from '../payment/core/types';

export class CustomProcessor implements IPaymentProcessor {
  constructor(private config: any) {}

  async processPayment(
    amount: number,
    currency: Currency,
    paymentMethod: PaymentMethod,
    metadata?: Record<string, unknown>
  ) {
    // Your custom implementation
    return { success: true, reference: 'custom_ref_123' };
  }

  async processRefund(reference: string, amount: number, currency: Currency) {
    // Your custom implementation
    return { success: true };
  }

  async verifyPayment(reference: string) {
    // Your custom implementation
    return { verified: true, status: 'completed' };
  }
}
```

Then use it:

```typescript
import { CustomProcessor } from './payment-processors/CustomProcessor';

// Replace the default processor
paymentService.processor = new CustomProcessor(config);
```

### Custom UI Styling

Override styles:

```css
/* src/styles/payment-custom.css */
.payment-component {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
}

.payment-button-primary {
  background: #ff6b6b;
}
```

### Custom Business Logic

Extend the service:

```typescript
// src/services/CustomPaymentService.ts
import { PaymentService } from './payment';
import { ProcessTransactionRequest, TransactionResult } from './payment/core/types';

export class CustomPaymentService extends PaymentService {
  async processTransaction(request: ProcessTransactionRequest): Promise<TransactionResult> {
    // Add custom validation
    if (request.amount > 1000) {
      // Require additional verification
      await this.verifyLargeTransaction(request);
    }

    // Add custom logic before processing
    console.log('Processing transaction with custom logic');

    // Call parent implementation
    const result = await super.processTransaction(request);

    // Add custom logic after processing
    if (result.success) {
      await this.sendConfirmationEmail(request.payerId);
    }

    return result;
  }

  private async verifyLargeTransaction(request: ProcessTransactionRequest) {
    // Custom verification logic
  }

  private async sendConfirmationEmail(userId: string) {
    // Send email
  }
}
```

## Database Customization

### Add Custom Fields

Extend the schema:

```sql
-- Add custom fields to transactions
ALTER TABLE transactions
ADD COLUMN custom_field_1 TEXT,
ADD COLUMN custom_field_2 INTEGER;

-- Add custom indexes
CREATE INDEX idx_transactions_custom_field ON transactions(custom_field_1);
```

Update the Transaction type:

```typescript
// src/services/payment/core/types.ts
export interface Transaction {
  // ... existing fields
  customField1?: string;
  customField2?: number;
}
```

### Add Custom Tables

```sql
-- Add a custom table for your needs
CREATE TABLE payment_plans (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(19, 4) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  interval VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

## Platform-Specific Integration

### PWA

```typescript
// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// Add to manifest.json
{
  "name": "My Payment App",
  "short_name": "PayApp",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#667eea"
}
```

### React Native

```typescript
// Use React Native components instead of web components
import { PaymentComponentNative } from './services/payment/ui-native';

// Platform-specific payment methods
<PaymentComponentNative
  paymentMethods={['apple_pay', 'google_pay']}
/>
```

### Web App

Standard React integration as shown above.

## Testing Your Integration

```typescript
// src/services/payment.test.ts
import { PaymentService } from './payment';

describe('Payment Service Integration', () => {
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

  test('should process payment', async () => {
    const result = await service.processTransaction({
      payerId: 'test_user_1',
      payeeId: '__SELF__',
      amount: 10.0,
      currency: 'USD',
    });

    expect(result.success).toBe(true);
  });
});
```

## Troubleshooting

### Database Connection Issues

```typescript
// Check database connection
const health = await paymentService.healthCheck();
console.log('Service health:', health);
```

### Payment Processor Issues

```typescript
// Test with mock processor first
{
  processor: {
    provider: 'mock',
    apiKey: 'test',
    testMode: true
  }
}
```

### TypeScript Errors

```bash
# Ensure all dependencies are installed
npm install

# Check TypeScript configuration
npx tsc --noEmit
```

## Migration Guide

### From Version 0.1.0 to 0.2.0

```sql
-- Run migration script
psql $DATABASE_URL < services/payment/database/migrations/002_version_0.2.0.sql
```

## Support

For issues specific to cloning:
1. Check this documentation
2. Review example apps in `/examples`
3. Open an issue on GitHub

## Next Steps

1. Customize the UI to match your brand
2. Add additional payment processors
3. Implement webhooks for payment confirmations
4. Add analytics and reporting
5. Set up monitoring and alerts

## Additional Resources

- [Main README](./README.md)
- [Database Schema](./database/README.md)
- [API Documentation](./api/README.md)
- [UI Components](./ui/README.md)
