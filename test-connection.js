// Description : Script d'initialisation de la base de données PostgreSQL
// Crée les tables, contraintes, indexes et données de test

const db = require('./src/config/database');
const logger = require('./src/config/logger');
const bcrypt = require('bcryptjs');


// SQL pour créer la structure de la base de données
const createTablesSQL = `
-- Suppression des tables existantes (ordre important pour les contraintes)
DROP TABLE IF EXISTS logs CASCADE;
DROP TABLE IF EXISTS stocks CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS inventories CASCADE;
DROP TABLE IF EXISTS stock_documents CASCADE;
DROP TABLE IF EXISTS stocK_document_items CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS sites CASCADE;


-- Création table des rôles
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
-- Création table des utilisateurs
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

-- Création table des catégories
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    site_id INTEGER REFERENCES sites(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Création table des produits
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


--creation table du stock
CREATE TABLE stocks (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    threshold INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Création table des mouvements
CREATE TABLE stock_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- entry, exit, transfer, adjustment
    quantity INTEGER NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT,
    reference_id INTEGER,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    motif TEXT,
    validated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    validated_at TIMESTAMP
);

--creation table des inventaires
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

--Creation table stock_documents
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

--Creation table de documents items
CREATE TABLE stock_document_items (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES stock_documents(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL
);

-- Création table des logs
CREATE TABLE logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Création des indexes pour optimiser les performances
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

-- Commentaires sur les tables
COMMENT ON TABLE users IS 'Table des utilisateurs du systeme NethaStock';
COMMENT ON TABLE categories IS 'Table des categories/familles de produits';
COMMENT ON TABLE products IS 'Table des produits en stock';
COMMENT ON TABLE stock_movements IS 'Table des mouvements de stock (entrees/sorties/transferts/ajustements)';
COMMENT ON TABLE logs IS 'Table des logs d activite du systeme';
COMMENT ON TABLE roles IS 'Table des roles utilisateurs (admin, magasinier)';
COMMENT ON TABLE sites IS 'Table des sites physiques (magasins, entrepots, agences)';
COMMENT ON TABLE stocks IS 'Table du stock des produits';
COMMENT ON TABLE inventories IS 'Table des inventaires';
COMMENT ON TABLE stock_documents IS 'Table des bordereaux';
COMMENT ON TABLE stock_document_items IS 'Table des items des bordereaux';

-- Commentaires sur les colonnes
COMMENT ON COLUMN users.email IS 'Adresse email de l utilisateur (unique)';
COMMENT ON COLUMN users.password IS 'Mot de passe hashé de l utilisateur';
COMMENT ON COLUMN users.first_name IS 'Prénom de l utilisateur';
COMMENT ON COLUMN users.last_name IS 'Nom de famille de l utilisateur';
COMMENT ON COLUMN users.role_id IS 'Référence vers le rôle de l utilisateur';
COMMENT ON COLUMN users.site_id IS 'Référence vers le site de l utilisateur';
COMMENT ON COLUMN products.name IS 'Nom du produit';
COMMENT ON COLUMN products.barcode IS 'Code-barres unique du produit';
COMMENT ON COLUMN products.selling_price IS 'Prix de vente du produit';
COMMENT ON COLUMN products.purchase_price IS 'Prix d achat du produit';
COMMENT ON COLUMN products.threshold IS 'Seuil d alerte pour le stock du produit';
COMMENT ON COLUMN products.category_id IS 'Référence vers la catégorie du produit';
COMMENT ON COLUMN stock_movements.type IS 'Type de mouvement (entry, exit, transfer, adjustment)';
`;

// Fonction pour insérer les données de test
async function insertTestData() {
  logger.info('Insertion des données de test...');

  try {
    // Hash des mots de passe
    const adminPassword = await bcrypt.hash('Admin123!', 12);
    const magPassword = await bcrypt.hash('Mag123!', 12);

    // Transaction pour insérer toutes les données
    await db.transaction(async (client) => {

        // Insertion des roles
      logger.info('Insertion des roles...');
      await client.query(`
        INSERT INTO roles (name, description) VALUES
        ('administrateur', 'Utilisateur avec tous les droits'),
        ('magasinier', 'Utilisateur avec droits limités')
      `);
      
      // Insertion des sites
      logger.info('Insertion des sites...');
      await client.query(`
        INSERT INTO sites (name, description, adress, city, postal_code, country, responsible_name, responsible_email, responsible_phone, type) VALUES
        ('Magasin Central', 'Magasin principal de NethaStock', '123 Rue Principale', 'Paris', '75001', 'France', 'Alice Dupont', 'Alice.Dupont@nethasoft.com', '01 23 45 67 89', 'Magasin'),
        ('Entrepôt Nord', 'Entrepôt de stockage pour la région nord', '456 Avenue du Nord', 'Lille', '59000', 'France', 'Bob Martin', 'Bob.Martin@nethasoft.com', '03 45 67 89 01', 'Entrepôt')
      `);
      
      // Insertion des utilisateurs
      logger.info('Insertion des utilisateurs...');
      await client.query(`
        INSERT INTO users (email, password, first_name, last_name, role_id, site_id) VALUES
        ('admin@nethasoft.com', $1, 'Admin', 'NethaStock', 1, 1),
        ('magasinier1@nethasoft.com', $2, 'Jean', 'Dupont', 2, 1),
        ('magasinier2@nethasoft.com', $2, 'Marie', 'Martin', 2, 2)
      `, [adminPassword, magPassword]);

      // Insertion des catégories
      logger.info('Insertion des categories...');
      await client.query(`
        INSERT INTO categories (name, description,site_id) VALUES
        ('Electronique', 'Produits electroniques et informatiques',1),
        ('Mobilier', 'Meubles et equipements de bureau', 2),
        ('Fournitures', 'Fournitures de bureau et consommables', 1),
        ('Outils', 'Outils et equipements techniques', 2),
        ('Consommables', 'Produits a usage unique et consommables', 1)
      `);

     // Insertion des produits
logger.info('Insertion des produits...');
await client.query(`
  INSERT INTO products (name, barcode, selling_price, purchase_price,  threshold, category_id, description, photo, active) 
  VALUES 
    ('Ordinateur Portable Dell Latitude', 'DELL001', 899.99, 200.00,  5, 1, 'Ordinateur portable professionnel 14 pouces', NULL, true),
    ('Clavier Sans Fil Logitech', 'LOG001', 45.50, 40.10, 8, 1, 'Clavier sans fil ergonomique', NULL, true),
    ('Chaise de Bureau Ergonomique', 'CHAIR001', 299.00, 200.00,  3, 2, 'Chaise de bureau avec support lombaire', NULL, true),
    ('Bureau Adjustable en Hauteur', 'DESK001', 450.75, 300.00,  2, 2, 'Bureau reglable electriquement', NULL, true),
    ('Ramette Papier A4 80g', 'PAP001', 4.99, 3.50,  15, 3, 'Ramette de 500 feuilles A4', NULL, true),
    ('Stylos Bille Bleus (Lot 10)', 'STYLO001', 8.99, 5.50,  10, 3, 'Lot de 10 stylos bille bleus', NULL, true),
    ('Perceuse Visseuse Bosch', 'BOSCH001', 89.99, 65.00,  4, 4, 'Perceuse visseuse sans fil 18V', NULL, true),
    ('Cartouches Encre Imprimante HP', 'HP001', 29.99, 18.50,  8, 5, 'Pack cartouches noir et couleur', NULL, true),
    ('Ecran 24 pouces Full HD', 'MON001', 199.99, 150.00,  6, 1, 'Moniteur LED 24 pouces 1920x1080', NULL, true),
    ('Lampe de Bureau LED', 'LAMP001', 35.99, 25.00, 7, 2, 'Lampe LED avec variateur et port USB', NULL, true)
`);

//insertion du stock
      logger.info('Insertion du stock...');
      await client.query(`
        INSERT INTO stocks (product_id, site_id,  threshold) VALUES
        (1, 1,  5),
        (2, 1,  8),
        (3, 2, 3),
        (4, 2,  2),
        (5, 1,  15),
        (6, 1, 10),
        (7, 2, 4),
        (8, 1, 8),
        (9, 1, 6),
        (10, 2, 7)
      `);

//Insertion des inventaires
logger.info('Insertion des inventaires...');
await client.query(`
  INSERT INTO inventories (product_id, site_id, system_quantity, real_quantity, difference, user_id) VALUES
  (1,1,8,4,4,1)
   `);

//Insertion de bordereaux
      logger.info('Insertion des bordereaux...');
      await client.query(`
        INSERT INTO stock_documents (type, site_id, destination_site_id, status, user_id) VALUES
  ('RECEPTION', 1, NULL, 'draft', 1)
   `);

//Insertion de items de bordereaux
      logger.info('Insertion des items de bordereaux');
      await client.query(`
        INSERT INTO stock_document_items (document_id, product_id, quantity) VALUES
  (1, 1, 10)
   `);
// Insertion des mouvements de stock
      logger.info('Insertion des mouvements de stock...');
      await client.query(`
  INSERT INTO stock_movements (product_id, site_id, type, quantity, user_id, reason, reference_id, date, motif, validated_by, validated_at) 
  VALUES 
    (1, 1, 'entry', 20, 1, 'Stock initial', NULL, NOW() - INTERVAL '30 days', 'Stock initial', 1, NOW() - INTERVAL '30 days'),
    (2, 1, 'entry', 50, 1, 'Stock initial', NULL, NOW() - INTERVAL '30 days', 'Stock initial', 1, NOW() - INTERVAL '30 days'),
    (3, 2, 'entry', 15, 1, 'Stock initial', NULL, NOW() - INTERVAL '30 days', 'Stock initial', 1, NOW() - INTERVAL '30 days'),
    (4, 2, 'entry', 10, 1, 'Stock initial', NULL, NOW() - INTERVAL '30 days', 'Stock initial', 1, NOW() - INTERVAL '30 days'),
    (5, 1, 'entry', 100, 1, 'Stock initial', NULL, NOW() - INTERVAL '30 days', 'Stock initial', 1, NOW() - INTERVAL '30 days'),
    (6, 1, 'entry', 80, 1, 'Stock initial', NULL, NOW() - INTERVAL '30 days', 'Stock initial', 1, NOW() - INTERVAL '30 days'),
    (7, 2, 'entry', 25, 1, 'Stock initial', NULL, NOW() - INTERVAL '30 days', 'Stock initial', 1, NOW() - INTERVAL '30 days'),
    (8, 1, 'entry', 40, 1, 'Stock initial', NULL, NOW() - INTERVAL '30 days', 'Stock initial', 1, NOW() - INTERVAL '30 days'),
    (9, 1, 'entry', 30, 1, 'Stock initial', NULL, NOW() - INTERVAL '30 days', 'Stock initial', 1, NOW() - INTERVAL '30 days'),
    (10, 2, 'entry', 20, 1, 'Stock initial', NULL, NOW() - INTERVAL '30 days', 'Stock initial', 1, NOW() - INTERVAL '30 days')
`); 

      // Récupération des IDs pour les mouvements
      const usersResult = await client.query('SELECT id FROM users ORDER BY id');
      const productsResult = await client.query('SELECT id FROM products ORDER BY id');
      
      const userIds = usersResult.rows.map(row => row.id);
      const productIds = productsResult.rows.map(row => row.id);

      // Insertion des mouvements de test
      logger.info('Insertion des mouvements...');
      
      // Insertion des mouvements de test
logger.info('Insertion des mouvements...');

// Mouvements d'entrée (stock initial)
// Mouvements d'entrée (stock initial)
for (let i = 0; i < productIds.length; i++) {
    const productId = productIds[i];
    const userId = userIds[Math.floor(Math.random() * userIds.length)];
    const quantity = Math.floor(Math.random() * 20) + 10;
    const siteId = 1; // ou 2 selon le produit, par défaut 1
    
    await client.query(`
        INSERT INTO stock_movements (product_id, site_id, type, quantity, user_id, motif, date) 
        VALUES ($1, $2, 'entry', $3, $4, 'Stock initial', NOW() - INTERVAL '${Math.floor(Math.random() * 30)} days')
    `, [productId, siteId, quantity, userId]);
}

// Mouvements divers (entrées, sorties, transferts, ajustements)
const movementTypes = ['entry', 'exit', 'transfer', 'adjustment'];
const motifs = {
    entry: ['Reapprovisionnement', 'Achat nouveau stock', 'Retour client', 'Correction inventaire'],
    exit: ['Vente client', 'Utilisation interne', 'Defectueux', 'Echantillon gratuit'],
    transfer: ['Transfert entre dépôts', 'Déplacement interne'],
    adjustment: ['Ajustement d\'inventaire', 'Correction de stock']
};

for (let i = 0; i < 25; i++) {
    const type = movementTypes[Math.floor(Math.random() * movementTypes.length)];
    const productId = productIds[Math.floor(Math.random() * productIds.length)];
    const userId = userIds[Math.floor(Math.random() * userIds.length)];
    const quantity = Math.floor(Math.random() * 10) + 1;
    const motif = motifs[type][Math.floor(Math.random() * motifs[type].length)];
    const daysAgo = Math.floor(Math.random() * 15);
    
    await client.query(`
        INSERT INTO stock_movements (product_id, site_id, type, quantity, user_id, motif, date) 
        VALUES ($1, 1, $2, $3, $4, $5, NOW() - INTERVAL '${daysAgo} days')
    `, [productId, type, quantity, userId, motif]);
}

    });

    logger.info('✓ Données de test insérées avec succès');
    
  } catch (error) {
    logger.error('Erreur insertion données de test:', error.message);
    throw error;
  }
}

// Fonction principale d'initialisation
async function initializeDatabase() {
  try {
    logger.info('🚀 Début de l\'initialisation de la base de données NethaStock');
    
    // Test de connexion
    const isConnected = await db.testConnection();
    if (!isConnected) {
      throw new Error('Impossible de se connecter à la base de données');
    }

    // Création des tables
    logger.info('Création de la structure de la base de données...');
    await db.query(createTablesSQL);
    logger.info('✓ Structure de la base de données créée');

    // Insertion des données de test
    await insertTestData();

    // Vérification finale
    logger.info('Vérification de l\'initialisation...');
    const verificationQueries = [
      'SELECT COUNT(*) as count FROM users',
      'SELECT COUNT(*) as count FROM categories', 
      'SELECT COUNT(*) as count FROM products',
      'SELECT COUNT(*) as count FROM stocks',
      'SELECT COUNT(*) as count FROM stock_movements',
      'SELECT COUNT(*) as count FROM roles',
      'SELECT COUNT(*) as count FROM inventories',
      'SELECT COUNT(*) as count FROM stock_documents',
      'SELECT COUNT(*) as count FROM stock_document_items',
      'SELECT COUNT(*) as count FROM logs'
    ];

    for (const query of verificationQueries) {
      const result = await db.query(query);
      const tableName = query.split('FROM ')[1];
      logger.info(`✓ Table ${tableName}: ${result.rows[0].count} enregistrements`);
    }

    logger.info('🎉 Initialisation de la base de données terminée avec succès !');
    logger.info('');
    logger.info('=== COMPTES DE TEST CRÉÉS ===');
    logger.info('👤 Administrateur:');
    logger.info('   Email: admin@nethasoft.com');
    logger.info('   Mot de passe: Admin123!');
    logger.info('');
    logger.info('👤 Magasiniers:');
    logger.info('   Email: magasinier1@nethasoft.com');
    logger.info('   Mot de passe: Mag123!');
    logger.info('   Email: magasinier2@nethasoft.com');
    logger.info('   Mot de passe: Mag123!');
    logger.info('===============================');

  } catch (error) {
    logger.error('❌ Erreur lors de l\'initialisation:', error.message);
    throw error;
  }
}

// Exécution si appelé directement
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.info('Script d\'initialisation terminé');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script d\'initialisation échoué:', error.message);
      process.exit(1);
    });
}

module.exports = { initializeDatabase, insertTestData };