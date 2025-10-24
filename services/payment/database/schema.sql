-- Payment Service Database Schema
-- Compatible with PostgreSQL / Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Accounts table
-- Stores account information and balances for users and platform
CREATE TABLE IF NOT EXISTS accounts (
  id VARCHAR(255) PRIMARY KEY,
  owner_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('user', 'platform', 'escrow', 'merchant')),
  balance DECIMAL(19, 4) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT positive_balance CHECK (balance >= 0),
  CONSTRAINT unique_owner_currency UNIQUE (owner_id, currency)
);

-- Transactions table
-- Stores all payment transactions with full audit trail
CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(255) PRIMARY KEY,
  payer_id VARCHAR(255) NOT NULL,
  payee_id VARCHAR(255) NOT NULL,
  amount DECIMAL(19, 4) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
  payment_method VARCHAR(50),
  processor_reference VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT different_parties CHECK (payer_id != payee_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_accounts_owner_id ON accounts(owner_id);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);
CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);

CREATE INDEX IF NOT EXISTS idx_transactions_payer_id ON transactions(payer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payee_id ON transactions(payee_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_processor_reference ON transactions(processor_reference);
CREATE INDEX IF NOT EXISTS idx_transactions_metadata_idempotency ON transactions((metadata->>'idempotencyKey'));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create platform account (SELF entity)
INSERT INTO accounts (id, owner_id, type, balance, currency, status)
VALUES ('platform-account', '__SELF__', 'platform', 0, 'USD', 'active')
ON CONFLICT (owner_id, currency) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE accounts IS 'User and platform account balances';
COMMENT ON TABLE transactions IS 'All payment transactions with full audit trail';
COMMENT ON COLUMN accounts.owner_id IS 'User ID or __SELF__ for platform account';
COMMENT ON COLUMN transactions.metadata IS 'Additional transaction data in JSON format';
COMMENT ON COLUMN transactions.processor_reference IS 'Reference ID from payment processor (Stripe, PayPal, etc.)';
