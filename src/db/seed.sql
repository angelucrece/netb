


-- ============================================================
-- NethaStock – Données initiales (seed)
-- ============================================================
-- SÉCURITÉ : ce fichier ne contient AUCUN mot de passe ni hash.
-- Les comptes de test sont créés sans mot de passe (NULL).
-- Utilisez le script scripts/reset-test-passwords.js pour
-- définir les mots de passe en environnement de développement.
-- ============================================================

-- ── ROLES ──────────────────────────────────────────────────
INSERT INTO roles (name, label, description, level) VALUES
  ('admin',          'Administrateur',    'Accès complet à toutes les fonctionnalités', 1),
  ('operator_stock', 'Opérateur Stock',   'Gestion des entrées/sorties de stock',       2),
  ('controller',     'Contrôleur',        'Validation des mouvements et inventaires',   3),
  ('site_manager',   'Responsable Site',  'Gestion d''un site spécifique',              4),
  ('viewer',         'Lecteur',           'Consultation uniquement',                    5),
  ('decision_maker', 'Décideur',          'Accès aux rapports et tableaux de bord',     6),
  ('accountant',     'Comptable',         'Accès aux données financières et exports',   7)
ON CONFLICT (name) DO NOTHING;

-- ── SITE PAR DÉFAUT ────────────────────────────────────────
INSERT INTO sites (name, type, city, country, responsible_name) VALUES
  ('Siège Principal', 'entrepot', 'Yaoundé', 'Cameroun', 'Administration')
ON CONFLICT DO NOTHING;

-- ── COMPTES DE TEST ────────────────────────────────────────
-- Les mots de passe sont définis via le script :
--   node scripts/reset-test-passwords.js
-- Ne jamais stocker de hash de mot de passe dans ce fichier.

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
BEGIN
  SELECT id INTO v_admin_role_id      FROM roles WHERE name = 'admin';
  SELECT id INTO v_operator_role_id   FROM roles WHERE name = 'operator_stock';
  SELECT id INTO v_controller_role_id FROM roles WHERE name = 'controller';
  SELECT id INTO v_manager_role_id    FROM roles WHERE name = 'site_manager';
  SELECT id INTO v_viewer_role_id     FROM roles WHERE name = 'viewer';
  SELECT id INTO v_decision_role_id   FROM roles WHERE name = 'decision_maker';
  SELECT id INTO v_accountant_role_id FROM roles WHERE name = 'accountant';
  SELECT id INTO v_site_id            FROM sites WHERE name = 'Siège Principal' LIMIT 1;

  -- password_hash = NULL : les comptes sont désactivés jusqu'à
  -- l'exécution de reset-test-passwords.js en local.
  INSERT INTO users (email, password_hash, first_name, last_name, role_id, site_id, active) VALUES
    ('naelle@nethastock.com',     NULL, 'Naelle',  'Admin',      v_admin_role_id,      v_site_id, FALSE),
    ('admin@nethastock.com',      NULL, 'Super',   'Admin',      v_admin_role_id,      v_site_id, FALSE),
    ('operator@nethastock.com',   NULL, 'Op',      'Stock',      v_operator_role_id,   v_site_id, FALSE),
    ('controller@nethastock.com', NULL, 'Jean',    'Contrôleur', v_controller_role_id, v_site_id, FALSE),
    ('manager@nethastock.com',    NULL, 'Marie',   'Manager',    v_manager_role_id,    v_site_id, FALSE),
    ('viewer@nethastock.com',     NULL, 'Paul',    'Viewer',     v_viewer_role_id,     v_site_id, FALSE),
    ('decision@nethastock.com',   NULL, 'Alice',   'Décideur',   v_decision_role_id,   v_site_id, FALSE),
    ('accountant@nethastock.com', NULL, 'Bob',     'Comptable',  v_accountant_role_id, v_site_id, FALSE)
  ON CONFLICT (email) DO NOTHING;
END $$;