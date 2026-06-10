-- ============================================================
-- NethaStock – Schéma PostgreSQL complet
-- ============================================================

-- Extension pour UUID (optionnel, on utilise SERIAL)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── DOMAINES (types réutilisables) ────────────────────────────
-- Évite la duplication littérale de 'validated' (SonarCloud S1192)
DROP DOMAIN IF EXISTS movement_status CASCADE;
DROP DOMAIN IF EXISTS document_status CASCADE;

CREATE DOMAIN movement_status AS VARCHAR(20)
  CHECK (VALUE IN ('pending', 'validated', 'rejected'));

CREATE DOMAIN document_status AS VARCHAR(20)
  CHECK (VALUE IN ('draft', 'validated', 'cancelled'));

-- ── ROLES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(50)  NOT NULL UNIQUE,
  label       VARCHAR(100) NOT NULL,
  description TEXT,
  level       INTEGER      NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── SITES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sites (
  id                 SERIAL PRIMARY KEY,
  name               VARCHAR(255) NOT NULL,
  type               VARCHAR(50)  NOT NULL CHECK (type IN ('entrepot','magasin','depot','agence')),
  address            VARCHAR(255),
  city               VARCHAR(100),
  postal_code        VARCHAR(20),
  country            VARCHAR(100) DEFAULT 'Cameroun',
  responsible_name   VARCHAR(150),
  responsible_email  VARCHAR(255),
  responsible_phone  VARCHAR(30),
  active             BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── USERS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id             SERIAL PRIMARY KEY,
  email          VARCHAR(255) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  first_name     VARCHAR(100) NOT NULL,
  last_name      VARCHAR(100) NOT NULL,
  role_id        INTEGER      REFERENCES roles(id) ON DELETE SET NULL,
  site_id        INTEGER      REFERENCES sites(id) ON DELETE SET NULL,
  active         BOOLEAN      NOT NULL DEFAULT TRUE,
  refresh_token  TEXT,
  fcm_token      TEXT,
  last_login     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── CATEGORIES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  site_id     INTEGER      REFERENCES sites(id) ON DELETE SET NULL,
  active      BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── PRODUCTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id             SERIAL PRIMARY KEY,
  sku            VARCHAR(100) NOT NULL UNIQUE,
  barcode        VARCHAR(50)  UNIQUE,
  name           VARCHAR(255) NOT NULL,
  brand          VARCHAR(100),
  unit           VARCHAR(30)  NOT NULL DEFAULT 'piece',
  description    TEXT,
  category_id    INTEGER      REFERENCES categories(id) ON DELETE SET NULL,
  purchase_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  sale_price     DECIMAL(12,2) NOT NULL DEFAULT 0,
  photo_url      VARCHAR(500),
  qr_code_url    VARCHAR(500),
  active         BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── PRODUCT VARIANTS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_variants (
  id            SERIAL PRIMARY KEY,
  product_id    INTEGER      NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_type  VARCHAR(50)  NOT NULL,
  variant_value VARCHAR(100) NOT NULL,
  sku_suffix    VARCHAR(50),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── PRODUCT STOCKS (stock par site) ────────────────────────
CREATE TABLE IF NOT EXISTS product_stocks (
  id         SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  site_id    INTEGER NOT NULL REFERENCES sites(id)    ON DELETE CASCADE,
  quantity   INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_stock  INTEGER NOT NULL DEFAULT 0,
  max_stock  INTEGER NOT NULL DEFAULT 9999,
  location   VARCHAR(100),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, site_id)
);

-- ── MOVEMENTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS movements (
  id                  SERIAL PRIMARY KEY,
  type                VARCHAR(20)  NOT NULL CHECK (type IN ('entry','exit','transfer','adjustment')),
  product_id          INTEGER      NOT NULL REFERENCES products(id),
  site_id             INTEGER      NOT NULL REFERENCES sites(id),
  destination_site_id INTEGER      REFERENCES sites(id),
  quantity            INTEGER      NOT NULL CHECK (quantity > 0),
  user_id             INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  status              movement_status NOT NULL DEFAULT 'pending',
  motif               TEXT,
  supplier            VARCHAR(255),
  validated_by        INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  validated_at        TIMESTAMPTZ,
  rejection_reason    TEXT,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── INVENTORY SESSIONS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_sessions (
  id           SERIAL PRIMARY KEY,
  site_id      INTEGER     NOT NULL REFERENCES sites(id),
  mode         VARCHAR(20) NOT NULL CHECK (mode IN ('complet','tournant')),
  status       VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','closed','validated')),
  started_by   INTEGER     REFERENCES users(id) ON DELETE SET NULL,
  validated_by INTEGER     REFERENCES users(id) ON DELETE SET NULL,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at     TIMESTAMPTZ
);

-- ── INVENTORY ITEMS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_items (
  id              SERIAL PRIMARY KEY,
  session_id      INTEGER NOT NULL REFERENCES inventory_sessions(id) ON DELETE CASCADE,
  product_id      INTEGER NOT NULL REFERENCES products(id),
  theoretical_qty INTEGER NOT NULL DEFAULT 0,
  counted_qty     INTEGER,
  gap             INTEGER GENERATED ALWAYS AS (COALESCE(counted_qty, 0) - theoretical_qty) STORED,
  counted_by      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  counted_at      TIMESTAMPTZ
);

-- ── NOTIFICATIONS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           VARCHAR(255) NOT NULL,
  body            TEXT,
  type            VARCHAR(50)  NOT NULL DEFAULT 'system' CHECK (type IN ('alert_low','movement','transfer','system')),
  reference_id    INTEGER,
  reference_type  VARCHAR(50),
  read            BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── AUDIT LOGS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  action       VARCHAR(100) NOT NULL,
  entity_type  VARCHAR(50),
  entity_id    INTEGER,
  old_value    JSONB,
  new_value    JSONB,
  ip_address   INET,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── INDEX ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_email        ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id      ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_site_id      ON users(site_id);
CREATE INDEX IF NOT EXISTS idx_products_sku       ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode   ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category  ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_stocks_product     ON product_stocks(product_id);
CREATE INDEX IF NOT EXISTS idx_stocks_site        ON product_stocks(site_id);
CREATE INDEX IF NOT EXISTS idx_movements_product  ON movements(product_id);
CREATE INDEX IF NOT EXISTS idx_movements_site     ON movements(site_id);
CREATE INDEX IF NOT EXISTS idx_movements_status   ON movements(status);
CREATE INDEX IF NOT EXISTS idx_movements_created  ON movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_user         ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_read         ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_audit_user         ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity       ON audit_logs(entity_type, entity_id);

-- ── STOCK DOCUMENTS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_documents (
  id                  SERIAL PRIMARY KEY,
  type                VARCHAR(20) NOT NULL CHECK (type IN ('reception','sortie','transfert')),
  site_id             INTEGER NOT NULL REFERENCES sites(id),
  destination_site_id INTEGER REFERENCES sites(id),
  reference           VARCHAR(100),
  notes               TEXT,
  status              VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','validated','cancelled')),
  created_by          INTEGER REFERENCES users(id) ON DELETE SET NULL,
  validated_by        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  validated_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_document_items (
  id          SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES stock_documents(id) ON DELETE CASCADE,
  product_id  INTEGER NOT NULL REFERENCES products(id),
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  unit_price  DECIMAL(12,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_doc_site   ON stock_documents(site_id);
CREATE INDEX IF NOT EXISTS idx_doc_status ON stock_documents(status);