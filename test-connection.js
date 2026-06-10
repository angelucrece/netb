/**
 * test-connection.js
 * Script d'initialisation et de peuplement de la base de données.
 * Usage DEV UNIQUEMENT : node test-connection.js
 *
 * PRNG non-sécurisé remplacé par crypto.randomInt() (CSPRNG natif Node.js)
 * pour satisfaire la règle SonarCloud S2245.
 */
'use strict';

const { createRequire } = require('node:module');
const db     = require('./src/config/database');
const logger = require('./src/config/logger');
const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');

// ── Helper CSPRNG ──────────────────────────────────────────────────────────
// Remplace Math.floor(Math.random() * n) partout dans ce fichier.
// crypto.randomInt(min, max) est cryptographiquement sûr (SonarCloud S2245).
const randInt = (min, max) => crypto.randomInt(min, max + 1);
const randItem = (arr) => arr[crypto.randomInt(0, arr.length)];

// SQL pour créer la structure de la base de données
const createTablesSQL = `
-- Suppression des tables existantes (ordre important pour les contraintes)
DROP TABLE IF EXISTS logs CASCADE;
DROP TABLE IF EXISTS stocks CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS inventories CASCADE;
DROP TABLE IF EXISTS stock_documents CASCADE;
DROP TABLE IF EXISTS stock_document_items CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS sites CASCADE;

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sites (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    adress VARCHAR(255),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    responsible_name VARCHAR(255),
    responsible_email VARCHAR(255),
    responsible_phone VARCHAR(50),
    type VARCHAR(50) NOT NULL
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
    site_id INTEGER REFERENCES sites(id) ON DELETE SET NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    site_id INTEGER REFERENCES sites(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    barcode VARCHAR(50) UNIQUE NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    purchase_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    threshold INTEGER NOT NULL DEFAULT 10,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    description TEXT,
    photo VARCHAR(255),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stocks (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    threshold INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stock_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT,
    reference_id INTEGER,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    motif TEXT,
    validated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    validated_at TIMESTAMP
);

CREATE TABLE inventories (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    system_quantity INTEGER NOT NULL DEFAULT 0,
    real_quantity INTEGER NOT NULL DEFAULT 0,
    difference INTEGER NOT NULL DEFAULT 0,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stock_documents (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    destination_site_id INTEGER REFERENCES sites(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stock_document_items (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES stock_documents(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL
);

CREATE TABLE logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_user ON stock_movements(user_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(date);
CREATE INDEX idx_inventories_product ON inventories(product_id);
CREATE INDEX idx_logs_user ON logs(user_id);
CREATE INDEX idx_logs_action ON logs(action);
CREATE INDEX idx_logs_date ON logs(created_at);
`;

async function insertTestData() {
  logger.info('Insertion des données de test...');

  try {
    // Les mots de passe sont lus depuis les variables d'environnement
    const adminPassword = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'CHANGE_ME_ADMIN', 12);
    const magPassword   = await bcrypt.hash(process.env.SEED_MAG_PASSWORD   || 'CHANGE_ME_MAG',   12);

    await db.transaction(async (client) => {
      logger.info('Insertion des roles...');
      await client.query(`
        INSERT INTO roles (name, description) VALUES
        ('administrateur', 'Utilisateur avec tous les droits'),
        ('magasinier', 'Utilisateur avec droits limités')
      `);

      logger.info('Insertion des sites...');
      await client.query(`
        INSERT INTO sites (name, description, adress, city, postal_code, country,
          responsible_name, responsible_email, responsible_phone, type) VALUES
        ('Magasin Central', 'Magasin principal', '123 Rue Principale', 'Yaoundé',
         '75001', 'Cameroun', 'Alice Dupont', 'alice@nethastock.com', '+237 690 000 001', 'magasin'),
        ('Entrepôt Nord', 'Entrepôt de stockage nord', '456 Avenue du Nord', 'Douala',
         '59000', 'Cameroun', 'Bob Martin', 'bob@nethastock.com', '+237 690 000 002', 'entrepot')
      `);

      logger.info('Insertion des utilisateurs...');
      await client.query(`
        INSERT INTO users (email, password, first_name, last_name, role_id, site_id) VALUES
        ('admin@nethastock.com',      $1, 'Admin', 'NethaStock', 1, 1),
        ('magasinier1@nethastock.com',$2, 'Jean',  'Dupont',     2, 1),
        ('magasinier2@nethastock.com',$2, 'Marie', 'Martin',     2, 2)
      `, [adminPassword, magPassword]);

      logger.info('Insertion des categories...');
      await client.query(`
        INSERT INTO categories (name, description, site_id) VALUES
        ('Electronique', 'Produits electroniques', 1),
        ('Mobilier',     'Meubles de bureau',       2),
        ('Fournitures',  'Fournitures de bureau',   1),
        ('Outils',       'Outils techniques',        2),
        ('Consommables', 'Produits consommables',   1)
      `);

      logger.info('Insertion des produits...');
      await client.query(`
        INSERT INTO products (name, barcode, selling_price, purchase_price, threshold, category_id, active)
        VALUES
        ('Ordinateur Portable Dell', 'DELL001', 899.99, 200.00, 5,  1, true),
        ('Clavier Logitech',         'LOG001',   45.50,  40.10, 8,  1, true),
        ('Chaise Ergonomique',        'CHAIR001',299.00, 200.00, 3,  2, true),
        ('Bureau Adjustable',         'DESK001', 450.75, 300.00, 2,  2, true),
        ('Ramette Papier A4',         'PAP001',    4.99,   3.50, 15, 3, true),
        ('Stylos Bille (Lot 10)',     'STYLO001',  8.99,   5.50, 10, 3, true),
        ('Perceuse Bosch',            'BOSCH001', 89.99,  65.00, 4,  4, true),
        ('Cartouches Encre HP',       'HP001',    29.99,  18.50, 8,  5, true),
        ('Ecran 24 pouces',           'MON001',  199.99, 150.00, 6,  1, true),
        ('Lampe de Bureau LED',       'LAMP001',  35.99,  25.00, 7,  2, true)
      `);

      logger.info('Insertion du stock...');
      await client.query(`
        INSERT INTO stocks (product_id, site_id, threshold) VALUES
        (1,1,5),(2,1,8),(3,2,3),(4,2,2),(5,1,15),
        (6,1,10),(7,2,4),(8,1,8),(9,1,6),(10,2,7)
      `);

      // ── Mouvements de test — crypto.randomInt() remplace Math.random() ──
      const usersResult    = await client.query('SELECT id FROM users ORDER BY id');
      const productsResult = await client.query('SELECT id FROM products ORDER BY id');
      const userIds    = usersResult.rows.map(r => r.id);
      const productIds = productsResult.rows.map(r => r.id);

      logger.info('Insertion des mouvements (stock initial)...');
      for (const productId of productIds) {
        const userId   = randItem(userIds);
        const quantity = randInt(10, 29);          // crypto.randomInt(10, 30)
        const daysAgo  = randInt(0, 29);           // crypto.randomInt(0, 30)
        await client.query(
          `INSERT INTO stock_movements
             (product_id, site_id, type, quantity, user_id, motif, date)
           VALUES ($1, 1, 'entry', $2, $3, 'Stock initial',
                   NOW() - ($4 || ' days')::INTERVAL)`,
          [productId, quantity, userId, daysAgo]
        );
      }

      logger.info('Insertion des mouvements divers...');
      const movementTypes = ['entry', 'exit', 'transfer', 'adjustment'];
      const motifs = {
        entry:      ['Réapprovisionnement', 'Achat nouveau stock', 'Retour client'],
        exit:       ['Vente client', 'Utilisation interne', 'Défectueux'],
        transfer:   ['Transfert inter-dépôts', 'Déplacement interne'],
        adjustment: ["Ajustement d'inventaire", 'Correction de stock'],
      };

      for (const _ of Array.from({ length: 25 })) { // eslint-disable-line no-unused-vars
        const type      = randItem(movementTypes);
        const productId = randItem(productIds);
        const userId    = randItem(userIds);
        const quantity  = randInt(1, 10);          // crypto.randomInt(1, 11)
        const motif     = randItem(motifs[type]);
        const daysAgo   = randInt(0, 14);          // crypto.randomInt(0, 15)
        await client.query(
          `INSERT INTO stock_movements
             (product_id, site_id, type, quantity, user_id, motif, date)
           VALUES ($1, 1, $2, $3, $4, $5,
                   NOW() - ($6 || ' days')::INTERVAL)`,
          [productId, type, quantity, userId, motif, daysAgo]
        );
      }
    });

    logger.info('✓ Données de test insérées avec succès');
  } catch (error) {
    logger.error('Erreur insertion données de test:', error.message);
    throw error;
  }
}

async function initializeDatabase() {
  try {
    logger.info("Début de l'initialisation de la base de données");
    const isConnected = await db.testConnection();
    if (!isConnected) throw new Error('Impossible de se connecter à la base de données');

    logger.info('Création de la structure...');
    await db.query(createTablesSQL);
    logger.info('✓ Structure créée');

    await insertTestData();
    logger.info('✓ Initialisation terminée');

  } catch (error) {
    logger.error("Erreur lors de l'initialisation:", error.message);
    throw error;
  }
}

if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { initializeDatabase, insertTestData };