// init-db.js
// ============================================================
// NethaStock - Initialisation PostgreSQL
// ============================================================

const db = require('./src/config/database');
const logger = require('./src/config/logger');

const createTablesSQL = `
-- ============================================================
-- DROP TABLES
-- ============================================================

DROP TABLE IF EXISTS stock_document_items CASCADE;
DROP TABLE IF EXISTS stock_documents CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS inventory_items CASCADE;
DROP TABLE IF EXISTS inventory_sessions CASCADE;
DROP TABLE IF EXISTS movements CASCADE;
DROP TABLE IF EXISTS product_stocks CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS sites CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

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
  role_id        INTEGER REFERENCES roles(id) ON DELETE SET NULL,
  site_id        INTEGER REFERENCES sites(id) ON DELETE SET NULL,
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  refresh_token  TEXT,
  fcm_token      TEXT,
  last_login     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CATEGORIES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  site_id     INTEGER REFERENCES sites(id) ON DELETE SET NULL,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PRODUCTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id              SERIAL PRIMARY KEY,
  sku             VARCHAR(100) NOT NULL UNIQUE,
  barcode         VARCHAR(50) UNIQUE,
  name            VARCHAR(255) NOT NULL,
  brand           VARCHAR(100),
  unit            VARCHAR(30) NOT NULL DEFAULT 'piece',
  description     TEXT,
  category_id     INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  purchase_price  DECIMAL(12,2) NOT NULL DEFAULT 0,
  sale_price      DECIMAL(12,2) NOT NULL DEFAULT 0,
  photo_url       VARCHAR(500),
  qr_code_url     VARCHAR(500),
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PRODUCT VARIANTS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_variants (
  id            SERIAL PRIMARY KEY,
  product_id    INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_type  VARCHAR(50) NOT NULL,
  variant_value VARCHAR(100) NOT NULL,
  sku_suffix    VARCHAR(50),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PRODUCT STOCKS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_stocks (
  id         SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  site_id    INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_stock  INTEGER NOT NULL DEFAULT 0,
  max_stock  INTEGER NOT NULL DEFAULT 9999,
  location   VARCHAR(100),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, site_id)
);

-- ── MOVEMENTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS movements (
  id                  SERIAL PRIMARY KEY,
  type                VARCHAR(20) NOT NULL CHECK (type IN ('entry','exit','transfer','adjustment')),
  product_id          INTEGER NOT NULL REFERENCES products(id),
  site_id             INTEGER NOT NULL REFERENCES sites(id),
  destination_site_id INTEGER REFERENCES sites(id),
  quantity            INTEGER NOT NULL CHECK (quantity > 0),
  user_id             INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status              VARCHAR(20) NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','validated','rejected')),
  motif               TEXT,
  supplier            VARCHAR(255),
  validated_by        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  validated_at        TIMESTAMPTZ,
  rejection_reason    TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── INVENTORY SESSIONS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_sessions (
  id           SERIAL PRIMARY KEY,
  site_id      INTEGER NOT NULL REFERENCES sites(id),
  mode         VARCHAR(20) NOT NULL CHECK (mode IN ('complet','tournant')),
  status       VARCHAR(20) NOT NULL DEFAULT 'in_progress'
                CHECK (status IN ('in_progress','closed','validated')),
  started_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  validated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
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
  gap             INTEGER GENERATED ALWAYS AS (
                    COALESCE(counted_qty, 0) - theoretical_qty
                  ) STORED,
  counted_by      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  counted_at      TIMESTAMPTZ
);

-- ── NOTIFICATIONS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           VARCHAR(255) NOT NULL,
  body            TEXT,
  type            VARCHAR(50) NOT NULL DEFAULT 'system'
                  CHECK (type IN ('alert_low','movement','transfer','system')),
  reference_id    INTEGER,
  reference_type  VARCHAR(50),
  read            BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── AUDIT LOGS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action       VARCHAR(100) NOT NULL,
  entity_type  VARCHAR(50),
  entity_id    INTEGER,
  old_value    JSONB,
  new_value    JSONB,
  ip_address   INET,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── STOCK DOCUMENTS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_documents (
  id                  SERIAL PRIMARY KEY,
  type                VARCHAR(20) NOT NULL
                      CHECK (type IN ('reception','sortie','transfert')),
  site_id             INTEGER NOT NULL REFERENCES sites(id),
  destination_site_id INTEGER REFERENCES sites(id),
  reference           VARCHAR(100),
  notes               TEXT,
  status              VARCHAR(20) NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft','validated','cancelled')),
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

-- ── INDEXES ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_email       ON users(email);
CREATE INDEX IF NOT EXISTS idx_products_sku      ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode  ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_movements_status  ON movements(status);
CREATE INDEX IF NOT EXISTS idx_doc_site          ON stock_documents(site_id);
`;

const seedSQL = `
-- ============================================================
-- SEED DATA
-- ============================================================

-- ── ROLES ──────────────────────────────────────────────────
INSERT INTO roles (name, label, description, level) VALUES
('admin', 'Administrateur', 'Accès complet', 1),
('operator_stock', 'Opérateur Stock', 'Gestion stock', 2),
('controller', 'Contrôleur', 'Validation', 3),
('site_manager', 'Responsable Site', 'Gestion site', 4),
('viewer', 'Lecteur', 'Consultation', 5),
('decision_maker', 'Décideur', 'Rapports', 6),
('accountant', 'Comptable', 'Finance', 7);


-- ── SITE ───────────────────────────────────────────────────
INSERT INTO sites (name, type, city, country, responsible_name)
VALUES 
  ('Siège Principal', 'entrepot', 'Yaoundé', 'Cameroun', 'Administration'),
  ('Magasin Centre Ville', 'magasin', 'Yaoundé', 'Cameroun', 'Jean Dupont'),
  ('Dépôt Nord', 'depot', 'Garoua', 'Cameroun', 'Marie Curie'),
  ('Agence Sud', 'agence', 'Douala', 'Cameroun', 'Paul Martin');


-- ── CATEGORIES ──────────────────────────────────────────────────
INSERT INTO categories (name, description, site_id, active, created_at, updated_at)
VALUES 
  ('Electronique', 'Produits electroniques et informatiques', 1, true, NOW(), NOW()),
  ('Mobilier', 'Meubles et equipements de bureau', 2, true, NOW(), NOW()),
  ('Fournitures', 'Fournitures de bureau et consommables', 1, true, NOW(), NOW()),
  ('Outils', 'Outils et equipements techniques', 2, true, NOW(), NOW()),
  ('Consommables', 'Produits a usage unique et consommables', 1, true, NOW(), NOW());


-- ── USERS ──────────────────────────────────────────────────
DO $$
DECLARE
  v_admin_role_id      INTEGER;
  v_operator_role_id   INTEGER;
  v_controller_role_id INTEGER;
  v_manager_role_id    INTEGER;
  v_viewer_role_id     INTEGER;
  v_decision_role_id   INTEGER;
  v_accountant_role_id INTEGER;
  v_site_id            INTEGER;

  v_hash TEXT :=
  '$2b$12$UGhNd45zSI8OjfAmT.sH5eICnyz4r9JihwjNAtInRE50texSNwU3e';
BEGIN

  SELECT id INTO v_admin_role_id
  FROM roles WHERE name = 'admin';

  SELECT id INTO v_operator_role_id
  FROM roles WHERE name = 'operator_stock';

  SELECT id INTO v_controller_role_id
  FROM roles WHERE name = 'controller';

  SELECT id INTO v_manager_role_id
  FROM roles WHERE name = 'site_manager';

  SELECT id INTO v_viewer_role_id
  FROM roles WHERE name = 'viewer';

  SELECT id INTO v_decision_role_id
  FROM roles WHERE name = 'decision_maker';

  SELECT id INTO v_accountant_role_id
  FROM roles WHERE name = 'accountant';

  SELECT id INTO v_site_id
  FROM sites
  WHERE name = 'Siège Principal'
  LIMIT 1;

  INSERT INTO users (
    email,
    password_hash,
    first_name,
    last_name,
    role_id,
    site_id,
    active
  )
  VALUES
    ('naelle@nethastock.com',     v_hash, 'Naelle', 'Admin',      v_admin_role_id,      v_site_id, TRUE),
    ('admin@nethastock.com',      v_hash, 'Super',  'Admin',      v_admin_role_id,      v_site_id, TRUE),
    ('operator@nethastock.com',   v_hash, 'Op',     'Stock',      v_operator_role_id,   v_site_id, TRUE),
    ('controller@nethastock.com', v_hash, 'Jean',   'Contrôleur', v_controller_role_id, v_site_id, TRUE),
    ('manager@nethastock.com',    v_hash, 'Marie',  'Manager',    v_manager_role_id,    v_site_id, TRUE),
    ('viewer@nethastock.com',     v_hash, 'Paul',   'Viewer',     v_viewer_role_id,     v_site_id, TRUE),
    ('decision@nethastock.com',   v_hash, 'Alice',  'Décideur',   v_decision_role_id,   v_site_id, TRUE),
    ('accountant@nethastock.com', v_hash, 'Bob',    'Comptable',  v_accountant_role_id, v_site_id, TRUE)

  ON CONFLICT (email) DO NOTHING;

END $$;
`;

async function initializeDatabase() {
  try {
    logger.info('🚀 Initialisation base de données...');

    await db.query(createTablesSQL);
    logger.info('✅ Tables créées');

    await db.query(seedSQL);
    logger.info('✅ Données insérées');

    logger.info('🎉 Base de données prête');

    process.exit(0);

  } catch (error) {
    logger.error('❌ Erreur initialisation:', error);
    process.exit(1);
  }
}

initializeDatabase();