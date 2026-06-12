/**
 * reset-test-passwords.js
 * ─────────────────────────────────────────────────────────────
 * Utilitaire DEV UNIQUEMENT.
 * Génère un hash bcrypt depuis la variable d'env SEED_PASSWORD
 * et l'applique aux comptes de test.
 *
 * Usage :
 *   SEED_PASSWORD=monMotDePasse node scripts/reset-test-passwords.js
 *
 * Ne jamais committer ce script avec un mot de passe en dur.
 * Ne jamais exécuter en production.
 * ─────────────────────────────────────────────────────────────
 */
'use strict';

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/database');

const TEST_EMAILS = [
  'naelle@nethastock.com',
  'admin@nethastock.com',
  'operator@nethastock.com',
  'controller@nethastock.com',
  'manager@nethastock.com',
  'viewer@nethastock.com',
  'decision@nethastock.com',
  'accountant@nethastock.com',
];

const run = async () => {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Ce script ne doit jamais tourner en production.');
    process.exit(1);
  }

  const plainPassword = process.env.SEED_PASSWORD;
  if (!plainPassword || plainPassword.length < 8) {
    console.error('❌ Définissez SEED_PASSWORD (min 8 caractères) dans votre .env local.');
    process.exit(1);
  }

  const hash = await bcrypt.hash(plainPassword, 12);
  console.log('Hash généré (ne pas committer) :', hash);

  for (const email of TEST_EMAILS) {
    await pool.query(
      `UPDATE users SET password_hash = $1, active = TRUE WHERE email = $2`,
      [hash, email]
    );
    console.log(`✓ Mot de passe défini pour ${email}`);
  }

  await pool.end();
  console.log('\n✅ Terminé. Comptes activés pour le développement local.');
};

run().catch((err) => {
  console.error('Erreur :', err.message);
  process.exit(1);
});