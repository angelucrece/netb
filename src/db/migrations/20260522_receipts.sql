-- Recus de paiement automatiques.
-- Cette migration ajoute les montants réellement recus/rendus sur un paiement
-- puis cree une table de recus qui conserve un snapshot complet de la vente.

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS amount_received DECIMAL(12,2);

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS amount_refunded DECIMAL(12,2) NOT NULL DEFAULT 0;

UPDATE payments
SET amount_received = amount
WHERE amount_received IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_payments_amount_received_refunded'
  ) THEN
    ALTER TABLE payments
      ADD CONSTRAINT chk_payments_amount_received_refunded
      CHECK (
        (amount_received IS NULL OR amount_received >= amount)
        AND amount_refunded >= 0
        AND (amount_received IS NULL OR amount_refunded <= amount_received)
      );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS receipts (
  id              SERIAL PRIMARY KEY,
  payment_id      INTEGER NOT NULL UNIQUE REFERENCES payments(id) ON DELETE CASCADE,
  invoice_id      INTEGER REFERENCES invoices(id) ON DELETE SET NULL,
  sale_order_id   INTEGER REFERENCES sale_orders(id) ON DELETE SET NULL,
  site_id         INTEGER REFERENCES sites(id) ON DELETE SET NULL,
  reference       VARCHAR(100) NOT NULL UNIQUE,
  client_name     VARCHAR(255),
  cashier_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  cashier_name    VARCHAR(255),
  payment_mode    VARCHAR(30),
  total_amount    DECIMAL(12,2) NOT NULL DEFAULT 0,
  amount_paid     DECIMAL(12,2) NOT NULL DEFAULT 0,
  amount_received DECIMAL(12,2) NOT NULL DEFAULT 0,
  amount_refunded DECIMAL(12,2) NOT NULL DEFAULT 0,
  payload         JSONB NOT NULL,
  issued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipts_invoice ON receipts(invoice_id);
CREATE INDEX IF NOT EXISTS idx_receipts_sale_order ON receipts(sale_order_id);
CREATE INDEX IF NOT EXISTS idx_receipts_site ON receipts(site_id);
CREATE INDEX IF NOT EXISTS idx_receipts_issued_at ON receipts(issued_at);
