# Payment Service Database

This directory contains database schemas and migrations for the Payment Service.

## Schema Overview

### Tables

#### `accounts`
Stores account information and balances for users and the platform.

- `id`: Unique account identifier
- `owner_id`: User ID or `__SELF__` for platform account
- `type`: Account type (user, platform, escrow, merchant)
- `balance`: Current account balance
- `currency`: Currency code (USD, EUR, etc.)
- `status`: Account status (active, suspended, closed)

#### `transactions`
Complete audit trail of all payment transactions.

- `id`: Unique transaction identifier
- `payer_id`: Account paying (source)
- `payee_id`: Account receiving (destination)
- `amount`: Transaction amount
- `currency`: Currency code
- `status`: Transaction status (pending, processing, completed, failed, refunded, cancelled)
- `payment_method`: Payment method used
- `processor_reference`: External payment processor reference ID
- `metadata`: Additional JSON data (idempotencyKey, description, etc.)

## Using with Supabase

### Setup

1. Create a new Supabase project
2. Run the schema SQL in the SQL editor:

```bash
# Copy the contents of schema.sql and run in Supabase SQL editor
```

Or use the Supabase CLI:

```bash
supabase db push
```

### Connection

Set these environment variables:

```env
DATABASE_URL=postgresql://[user]:[password]@db.[project-ref].supabase.co:5432/postgres
SUPABASE_KEY=[your-anon-key]
DB_PROVIDER=supabase
```

### Migrations

To apply migrations in order:

```bash
# Migration 001: Initial schema
psql $DATABASE_URL < migrations/001_initial_schema.sql
```

## Special Entities

### SELF Entity (`__SELF__`)

The `__SELF__` entity represents the platform/company account:

- **Customer to Platform**: `{ payerId: 'user123', payeeId: '__SELF__', ... }`
- **Platform to Customer**: `{ payerId: '__SELF__', payeeId: 'user123', ... }`

This enables:
- Platform fee collection
- Refunds and payouts
- Internal transfers
- Revenue tracking

## Indexes

Optimized indexes for common queries:

- Owner lookups (`owner_id`)
- Transaction history (`payer_id`, `payee_id`)
- Status filtering (`status`)
- Chronological sorting (`created_at`)
- Idempotency checks (`metadata->>'idempotencyKey'`)

## Row Level Security (RLS)

For production Supabase deployments, enable RLS:

```sql
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own accounts
CREATE POLICY "Users can view own accounts" ON accounts
  FOR SELECT USING (owner_id = auth.uid()::text);

-- Users can only see their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (
    payer_id = auth.uid()::text OR
    payee_id = auth.uid()::text
  );
```

## Testing

Seed data for testing:

```sql
-- Create test user accounts
INSERT INTO accounts (id, owner_id, type, balance, currency, status)
VALUES
  ('test-user-1', 'user-123', 'user', 100.00, 'USD', 'active'),
  ('test-user-2', 'user-456', 'user', 50.00, 'USD', 'active');

-- Create test transaction
INSERT INTO transactions (
  id, payer_id, payee_id, amount, currency, status, metadata
)
VALUES (
  'test-tx-1',
  'user-123',
  'user-456',
  25.00,
  'USD',
  'completed',
  '{"description": "Test payment"}'::jsonb
);
```
