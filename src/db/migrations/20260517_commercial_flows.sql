-- NethaStock commercial flows: purchases, sales, deliveries, invoices, payments.

INSERT INTO roles (name, label, description, level) VALUES
  ('buyer', 'Responsable achats', 'Gestion des fournisseurs et commandes achat', 8),
  ('commercial', 'Commercial', 'Gestion des clients et ventes', 9),
  ('cashier', 'Caissier', 'Encaissements et sessions de caisse', 10),
  ('delivery_agent', 'Livreur', 'Preparation et validation des livraisons', 11),
  ('maintenance', 'Charge de maintenance', 'Installation, support technique et disponibilite', 12)
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS suppliers (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  contact_name VARCHAR(150),
  email        VARCHAR(255),
  phone        VARCHAR(40),
  address      VARCHAR(255),
  city         VARCHAR(100),
  country      VARCHAR(100) DEFAULT 'Cameroun',
  tax_number   VARCHAR(100),
  notes        TEXT,
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clients (
  id                 SERIAL PRIMARY KEY,
  type               VARCHAR(20) NOT NULL DEFAULT 'occasional'
                     CHECK (type IN ('company','occasional')),
  name               VARCHAR(255) NOT NULL,
  contact_name       VARCHAR(150),
  email              VARCHAR(255),
  phone              VARCHAR(40),
  address            VARCHAR(255),
  city               VARCHAR(100),
  tax_number         VARCHAR(100),
  payment_terms_days INTEGER NOT NULL DEFAULT 0 CHECK (payment_terms_days >= 0),
  discount_rate      DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (discount_rate >= 0),
  credit_limit       DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (credit_limit >= 0),
  notes              TEXT,
  active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id             SERIAL PRIMARY KEY,
  supplier_id    INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
  site_id        INTEGER NOT NULL REFERENCES sites(id),
  reference      VARCHAR(100),
  status         VARCHAR(30) NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft','ordered','partially_received','received','cancelled')),
  expected_at    TIMESTAMPTZ,
  notes          TEXT,
  total_amount   DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  received_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  received_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id                SERIAL PRIMARY KEY,
  purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id        INTEGER NOT NULL REFERENCES products(id),
  quantity          INTEGER NOT NULL CHECK (quantity > 0),
  received_quantity INTEGER NOT NULL DEFAULT 0 CHECK (received_quantity >= 0),
  unit_price        DECIMAL(12,2) NOT NULL DEFAULT 0,
  line_total        DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

CREATE TABLE IF NOT EXISTS sale_orders (
  id                   SERIAL PRIMARY KEY,
  client_id            INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  site_id              INTEGER NOT NULL REFERENCES sites(id),
  reference            VARCHAR(100),
  channel              VARCHAR(20) NOT NULL DEFAULT 'store'
                       CHECK (channel IN ('company','occasional','store')),
  client_name          VARCHAR(255),
  client_phone         VARCHAR(40),
  status               VARCHAR(30) NOT NULL DEFAULT 'draft'
                       CHECK (status IN ('draft','confirmed','prepared','delivered','invoiced','closed','cancelled')),
  payment_status       VARCHAR(20) NOT NULL DEFAULT 'unpaid'
                       CHECK (payment_status IN ('unpaid','partial','paid','refunded')),
  delivery_required    BOOLEAN NOT NULL DEFAULT FALSE,
  delivery_address     VARCHAR(255),
  delivery_fee         DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_amount      DECIMAL(12,2) NOT NULL DEFAULT 0,
  subtotal             DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount         DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes                TEXT,
  created_by           INTEGER REFERENCES users(id) ON DELETE SET NULL,
  confirmed_by         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  confirmed_at         TIMESTAMPTZ,
  cancelled_by         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  cancelled_at         TIMESTAMPTZ,
  cancellation_reason  TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_order_items (
  id              SERIAL PRIMARY KEY,
  sale_order_id   INTEGER NOT NULL REFERENCES sale_orders(id) ON DELETE CASCADE,
  product_id      INTEGER NOT NULL REFERENCES products(id),
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  unit_price      DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  line_total      DECIMAL(12,2) GENERATED ALWAYS AS ((quantity * unit_price) - discount_amount) STORED
);

CREATE TABLE IF NOT EXISTS deliveries (
  id               SERIAL PRIMARY KEY,
  sale_order_id    INTEGER NOT NULL REFERENCES sale_orders(id) ON DELETE CASCADE,
  reference        VARCHAR(100),
  status           VARCHAR(30) NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','in_transit','delivered','cancelled')),
  delivery_address VARCHAR(255),
  delivery_fee     DECIMAL(12,2) NOT NULL DEFAULT 0,
  delivered_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  delivered_at     TIMESTAMPTZ,
  notes            TEXT,
  created_by       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id              SERIAL PRIMARY KEY,
  sale_order_id   INTEGER NOT NULL REFERENCES sale_orders(id) ON DELETE CASCADE,
  client_id       INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  reference       VARCHAR(100) NOT NULL UNIQUE,
  issue_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date        DATE,
  status          VARCHAR(30) NOT NULL DEFAULT 'issued'
                  CHECK (status IN ('draft','issued','partially_paid','paid','cancelled','overdue')),
  subtotal        DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  delivery_fee    DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount    DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid_amount     DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_by      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cash_sessions (
  id              SERIAL PRIMARY KEY,
  cashier_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  site_id         INTEGER NOT NULL REFERENCES sites(id),
  opening_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  closing_balance DECIMAL(12,2),
  expected_amount DECIMAL(12,2),
  variance_amount DECIMAL(12,2),
  status          VARCHAR(20) NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open','closed')),
  opened_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at       TIMESTAMPTZ,
  notes           TEXT
);

CREATE TABLE IF NOT EXISTS payments (
  id              SERIAL PRIMARY KEY,
  invoice_id      INTEGER REFERENCES invoices(id) ON DELETE SET NULL,
  sale_order_id   INTEGER REFERENCES sale_orders(id) ON DELETE SET NULL,
  cash_session_id INTEGER REFERENCES cash_sessions(id) ON DELETE SET NULL,
  amount          DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  mode            VARCHAR(30) NOT NULL
                  CHECK (mode IN ('cash','orange_money','mtn_money','card','bank_transfer','cheque','credit')),
  type            VARCHAR(20) NOT NULL DEFAULT 'full'
                  CHECK (type IN ('deposit','balance','full','invoice')),
  reference       VARCHAR(100),
  notes           TEXT,
  received_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  paid_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO suppliers (name, contact_name, phone, city, notes)
SELECT 'Fournisseur Central', 'Service commercial', '+237 690 000 001', 'Douala', 'Fournisseur de demonstration'
WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'Fournisseur Central');

INSERT INTO clients (type, name, contact_name, phone, city, payment_terms_days, discount_rate)
SELECT 'company', 'Entreprise Alpha SARL', 'Responsable achats', '+237 690 000 101', 'Yaounde', 30, 5
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Entreprise Alpha SARL');

INSERT INTO clients (type, name, contact_name, phone, city)
SELECT 'occasional', 'Client comptoir', 'Client comptoir', '+237 690 000 102', 'Douala'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Client comptoir');

CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(active);
CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(type);
CREATE INDEX IF NOT EXISTS idx_clients_active ON clients(active);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_site ON purchase_orders(site_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_sale_orders_client ON sale_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_sale_orders_site ON sale_orders(site_id);
CREATE INDEX IF NOT EXISTS idx_sale_orders_status ON sale_orders(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_sale_order ON deliveries(sale_order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_invoices_sale_order ON invoices(sale_order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_sale_order ON payments(sale_order_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_cashier ON cash_sessions(cashier_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cash_sessions_open_unique
  ON cash_sessions(cashier_id, site_id) WHERE status = 'open';
