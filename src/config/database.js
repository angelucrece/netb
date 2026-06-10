const { Pool } = require('pg');
const fs = require('node:fs');
const path = require('node:path');
const logger = require('./logger');
require('dotenv').config();

// ── Pool principal ──────────────────────────────────────────
const pool = new Pool({
  user:     process.env.DB_USERNAME,
  host:     process.env.DB_HOST     || 'localhost',
  database: process.env.DB_NAME     || 'nethastock',
  password: process.env.DB_PASSWORD,
  port:     Number.parseInt(process.env.DB_PORT) || 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error('[DB] Erreur inattendue sur client inactif', { error: err.message });
});

// ── Helpers ─────────────────────────────────────────────────
const query = async (text, params) => {
  try {
    return await pool.query(text, params);
  } catch (err) {
    logger.error('[DB] Erreur requête', { text, error: err.message });
    throw err;
  }
};

const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ── Initialisation automatique ──────────────────────────────
/**
 * Crée la DB si elle n'existe pas, puis exécute schema.sql + seed.sql
 * si la table `roles` est absente (premier lancement).
 */
const initializeDatabase = async () => {
  // 1. S'assurer que la base de données existe
  await ensureDatabaseExists();

  // 2. Vérifier si le schéma est déjà en place (sentinel : table roles)
  try {
    const check = await pool.query(
      `SELECT to_regclass('public.roles') AS exists`
    );

    if (check.rows[0].exists) {
      logger.info('[DB] Base déjà initialisée');
      await runMigrations();
      return;
    }

    logger.info('[DB] Première initialisation – création des tables et données...');

    const schemaSQL = fs.readFileSync(
      path.join(__dirname, '../db/schema.sql'), 'utf8'
    );
    const seedSQL = fs.readFileSync(
      path.join(__dirname, '../db/seed.sql'), 'utf8'
    );

    await pool.query(schemaSQL);
    logger.info('[DB] Schéma créé');

    await pool.query(seedSQL);
    logger.info('[DB] Données initiales insérées (rôles + comptes de test)');

    await runMigrations();

  } catch (err) {
    logger.error('[DB] Erreur initialisation', { error: err.message });
    throw err;
  }
};

/**
 * Exécute les migrations SQL idempotentes stockées dans src/db/migrations.
 * Règle : les tables commerciales et les contraintes métier doivent être
 * appliquées sur une base neuve comme sur une base déjà existante.
 */
const runMigrations = async () => {
  const migrationsDir = path.join(__dirname, '../db/migrations');
  if (!fs.existsSync(migrationsDir)) return;

  const files = fs.readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .sort((a, b) => a.localeCompare(b));

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    await pool.query(sql);
    logger.info('[DB] Migration appliquée', { file });
  }
};

/**
 * Se connecte à la DB système "postgres" pour créer la DB cible si absente.
 */
const ensureDatabaseExists = async () => {
  const dbName = process.env.DB_NAME || 'nethastock';

  const adminPool = new Pool({
    user:     process.env.DB_USERNAME,
    host:     process.env.DB_HOST     || 'localhost',
    database: 'postgres', // DB système toujours présente
    password: process.env.DB_PASSWORD,
    port:     Number.parseInt(process.env.DB_PORT) || 5432,
    connectionTimeoutMillis: 5000,
  });

  try {
    const res = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]
    );

    if (res.rowCount === 0) {
      // Les identifiants de base de données ne peuvent pas être paramétrés en DDL PostgreSQL.
      // On valide strictement le nom avant interpolation (SonarCloud S3649).
      if (!/^\w+$/.test(dbName)) {
        throw new Error(`[DB] Nom de base de données invalide : "${dbName}". Seuls a-z, A-Z, 0-9 et _ sont autorisés.`);
      }
      await adminPool.query(`CREATE DATABASE "${dbName}"`); // NOSONAR: dbName validé par regex [a-zA-Z0-9_] ligne précédente
      logger.info(`[DB] Base de données "${dbName}" créée`);
    }
  } catch (err) {
    logger.error('[DB] Impossible de vérifier/créer la base', { error: err.message });
    throw err;
  } finally {
    await adminPool.end();
  }
};

const testConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW() as now');
    logger.info('[DB] Connexion PostgreSQL OK', { time: res.rows[0].now });
    return true;
  } catch (err) {
    logger.error('[DB] Connexion PostgreSQL échouée', { error: err.message });
    return false;
  }
};

const close = async () => {
  await pool.end();
  logger.info('[DB] Pool fermée');
};

module.exports = { query, transaction, testConnection, initializeDatabase, close, pool };