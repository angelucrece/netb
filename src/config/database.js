// Description : Configuration et gestion de la connexion PostgreSQL
// Fournit une interface pour les requêtes à la base de données

const { Pool } = require('pg');
const logger = require('./logger');
require('dotenv').config();

// Configuration de la pool de connexions PostgreSQL
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: { rejectUnauthorized: false }, // Obligatoire pour Render PostgreSQL cloud
//   max: 20, // Nombre maximum de connexions dans la pool
//   idleTimeoutMillis: 30000, // Fermeture des connexions inactives après 30s
//   connectionTimeoutMillis: 5000, // Timeout de connexion à 5s
// });
//const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});


// Gestion des événements de la pool
pool.on('connect', () => {
  logger.info('Nouvelle connexion PostgreSQL établie');
});

pool.on('error', (err) => {
  logger.error('Erreur inattendue sur client PostgreSQL inactif:', err);
});

// Fonction wrapper pour les requêtes avec gestion d'erreurs
const query = async (text, params) => {
  const start = Date.now();
  try {
    logger.debug('Exécution requête:', { text, params });
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Requête exécutée', { 
      duration: `${duration}ms`, 
      rows: res.rowCount 
    });
    return res;
  } catch (error) {
    logger.error('Erreur requête PostgreSQL:', {
      text,
      params,
      error: error.message
    });
    throw error;
  }
};

// Fonction pour obtenir un client pour les transactions
const getClient = async () => {
  try {
    const client = await pool.connect();
    logger.debug('Client PostgreSQL obtenu pour transaction');
    return client;
  } catch (error) {
    logger.error('Erreur obtention client PostgreSQL:', error.message);
    throw error;
  }
};

// Fonction pour exécuter une transaction
const transaction = async (callback) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    logger.debug('Transaction démarrée');
    
    const result = await callback(client);
    
    await client.query('COMMIT');
    logger.debug('Transaction validée');
    
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction annulée:', error.message);
    throw error;
  } finally {
    client.release();
    logger.debug('Client PostgreSQL libéré');
  }
};

// Test de la connexion
const testConnection = async () => {
  try {
    const result = await query('SELECT NOW() as now, version() as version');
    logger.info('Test connexion PostgreSQL réussi:', {
      timestamp: result.rows[0].now,
      version: result.rows[0].version.split(' ')[0]
    });
    return true;
  } catch (error) {
    logger.error('Test connexion PostgreSQL échoué:', error.message);
    return false;
  }
};

// Fermeture propre de la pool
const close = async () => {
  try {
    await pool.end();
    logger.info('Pool PostgreSQL fermée');
  } catch (error) {
    logger.error('Erreur fermeture pool PostgreSQL:', error.message);
  }
};

module.exports = {
  query,
  getClient,
  transaction,
  testConnection,
  close,
  pool
};
