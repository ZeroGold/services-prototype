# Lift League

Example PWA application demonstrating integration of the Cloneable Payment Service.

## Overview

Lift League is a fictional fitness tracking and competition platform that uses the Payment Service for subscription payments and transactions.

## Features

- Subscription checkout with multiple plans
- Account balance display
- Transaction history
- Complete Payment Service integration

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# From project root
npm install

# Or install just this app
cd apps/lift-league
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the app.

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
lift-league/
├── src/
│   ├── pages/            # Page components
│   │   ├── HomePage.tsx
│   │   ├── CheckoutPage.tsx
│   │   ├── BalancePage.tsx
│   │   └── TransactionsPage.tsx
│   ├── services/         # Service initialization
│   │   ├── index.ts      # Service setup
│   │   └── database.ts   # Mock database
│   ├── App.tsx           # Main app component
│   ├── App.css           # App styles
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── package.json
└── README.md
```

## Payment Service Integration

### 1. Service Initialization

```typescript
// src/services/index.ts
import { PaymentService } from '@services/payment';

export let paymentService: PaymentService;

export async function initializeServices() {
  paymentService = new PaymentService();
  await paymentService.initialize(config, context);
}
```

### 2. Using UI Components

```tsx
// src/pages/CheckoutPage.tsx
import { PaymentComponent } from '@services/payment/ui';
import '@services/payment/ui/styles.css';

<PaymentComponent
  payerId={currentUser.id}
  payeeId="__SELF__"
  amount={49.99}
  onSuccess={handleSuccess}
  onError={handleError}
/>
```

### 3. Checking Balance

```tsx
// src/pages/BalancePage.tsx
import { BalanceDisplay } from '@services/payment/ui';

<BalanceDisplay
  userId={currentUser.id}
  showDetails={true}
  refreshInterval={30000}
/>
```

### 4. Transaction History

```tsx
// src/pages/TransactionsPage.tsx
import { PaymentHistory } from '@services/payment/ui';

<PaymentHistory
  userId={currentUser.id}
  limit={20}
  onTransactionClick={handleClick}
/>
```

## Mock Data

This demo uses a mock database and mock payment processor for demonstration purposes. In production:

1. Replace mock database with actual database connection
2. Configure real payment processor (Stripe, PayPal, etc.)
3. Add proper authentication
4. Implement security measures

## Customization

### Styling

Override Payment Service styles in your CSS files:

```css
.payment-component {
  /* Your custom styles */
}
```

### Business Logic

Extend the Payment Service for custom behavior:

```typescript
import { PaymentService } from '@services/payment';

class LiftLeaguePaymentService extends PaymentService {
  // Custom implementation
}
```

## Deployment

### As PWA

The app is configured as a PWA with:
- Service worker
- Manifest file
- Offline support

### Deploy to Vercel

```bash
npm run build
vercel deploy
```

### Deploy to Netlify

```bash
npm run build
netlify deploy --prod --dir=dist
```

## Environment Variables

Create `.env` file:

```env
VITE_API_URL=http://localhost:3000
VITE_DATABASE_URL=your-database-url
VITE_STRIPE_API_KEY=your-stripe-key
```

## Testing

```bash
npm run test
```

## Learn More

- [Payment Service Documentation](../../services/payment/README.md)
- [Cloning Guide](../../services/payment/CLONING.md)
- [Architecture Overview](../../docs/ARCHITECTURE.md)

## License

MIT
