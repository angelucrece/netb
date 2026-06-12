-- ============================================================
-- Migration : 20260518_roles_access_seed.sql
-- Ajout des rôles commerciaux et comptes de test associés
-- ============================================================
-- SÉCURITÉ : aucun hash de mot de passe dans ce fichier.
-- Les comptes sont créés inactifs (active = FALSE) avec un hash placeholder.
-- Activer via : SEED_PASSWORD=xxx node scripts/reset-test-passwords.js
-- ============================================================

-- ── NOUVEAUX RÔLES COMMERCIAUX ─────────────────────────────
INSERT INTO roles (name, label, description, level) VALUES
  ('commercial',      'Commercial',        'Gestion des clients et des ventes',         5),
  ('cashier',         'Caissier',          'Gestion des sessions de caisse',            6),
  ('buyer',           'Acheteur',          'Gestion des fournisseurs et des achats',    7),
  ('delivery_agent',  'Agent Livraison',   'Gestion des livraisons',                    8),
  ('maintenance',     'Maintenance',       'Support technique',                          9)
ON CONFLICT (name) DO NOTHING;

-- ── COMPTES DE TEST SUPPLÉMENTAIRES ────────────────────────
DO $$
DECLARE
  v_commercial_role_id  INTEGER;
  v_cashier_role_id     INTEGER;
  v_buyer_role_id       INTEGER;
  v_delivery_role_id    INTEGER;
  v_site_id             INTEGER;
BEGIN
  SELECT id INTO v_commercial_role_id FROM roles WHERE name = 'commercial';
  SELECT id INTO v_cashier_role_id    FROM roles WHERE name = 'cashier';
  SELECT id INTO v_buyer_role_id      FROM roles WHERE name = 'buyer';
  SELECT id INTO v_delivery_role_id   FROM roles WHERE name = 'delivery_agent';
  SELECT id INTO v_site_id            FROM sites WHERE name = 'Siège Principal' LIMIT 1;

  -- hash placeholder : compte inactif, ne permet aucune connexion.
  INSERT INTO users (email, password_hash, first_name, last_name, role_id, site_id, active) VALUES
    ('commercial@nethastock.com',  '$2b$12$PLACEHOLDER_COMPTE_DESACTIVE_CHANGER_AVEC_RESET_SCRIPT', 'Paul',   'Commercial', v_commercial_role_id, v_site_id, FALSE),
    ('cashier@nethastock.com',     '$2b$12$PLACEHOLDER_COMPTE_DESACTIVE_CHANGER_AVEC_RESET_SCRIPT', 'Sophie', 'Caissière',  v_cashier_role_id,    v_site_id, FALSE),
    ('buyer@nethastock.com',       '$2b$12$PLACEHOLDER_COMPTE_DESACTIVE_CHANGER_AVEC_RESET_SCRIPT', 'Marc',   'Acheteur',   v_buyer_role_id,      v_site_id, FALSE),
    ('delivery@nethastock.com',    '$2b$12$PLACEHOLDER_COMPTE_DESACTIVE_CHANGER_AVEC_RESET_SCRIPT', 'Pierre', 'Livreur',    v_delivery_role_id,   v_site_id, FALSE)
  ON CONFLICT (email) DO NOTHING;
END $$;