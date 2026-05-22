-- Transactions de paiement externes: Stripe, MTN MoMo, Orange Money, etc.

CREATE TABLE IF NOT EXISTS payment_transactions (
  id                 SERIAL PRIMARY KEY,
  invoice_id         INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  sale_order_id      INTEGER REFERENCES sale_orders(id) ON DELETE SET NULL,
  provider           VARCHAR(50) NOT NULL CHECK (provider IN ('stripe','mtn_momo','orange_money')),
  provider_reference VARCHAR(150),
  status             VARCHAR(30) NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','processing','succeeded','failed','cancelled')),
  amount             DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  currency           VARCHAR(3) NOT NULL DEFAULT 'XAF',
  mode               VARCHAR(50) NOT NULL,
  type               VARCHAR(20) NOT NULL DEFAULT 'invoice'
                     CHECK (type IN ('deposit','balance','full','invoice')),
  checkout_url       TEXT,
  client_secret      TEXT,
  request_payload    JSONB,
  raw_response       JSONB,
  created_by         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  confirmed_by       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_invoice
  ON payment_transactions(invoice_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_status
  ON payment_transactions(status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_transactions_provider_ref
  ON payment_transactions(provider, provider_reference)
  WHERE provider_reference IS NOT NULL;
