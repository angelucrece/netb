-- Alignement droits cahier de charges: roles operationnels et comptes de test.

INSERT INTO roles (name, label, description, level) VALUES
  ('maintenance', 'Charge de maintenance', 'Installation, support technique et disponibilite', 12)
ON CONFLICT (name) DO NOTHING;

DO $$
DECLARE
  v_site_id INTEGER;
  v_hash TEXT := '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK2.';
BEGIN
  SELECT id INTO v_site_id FROM sites ORDER BY id LIMIT 1;

  INSERT INTO users (email, password_hash, first_name, last_name, role_id, site_id, active)
  SELECT 'buyer@nethastock.com', v_hash, 'Brice', 'Achats', r.id, v_site_id, TRUE
  FROM roles r WHERE r.name = 'buyer'
  ON CONFLICT (email) DO NOTHING;

  INSERT INTO users (email, password_hash, first_name, last_name, role_id, site_id, active)
  SELECT 'commercial@nethastock.com', v_hash, 'Carine', 'Vente', r.id, v_site_id, TRUE
  FROM roles r WHERE r.name = 'commercial'
  ON CONFLICT (email) DO NOTHING;

  INSERT INTO users (email, password_hash, first_name, last_name, role_id, site_id, active)
  SELECT 'cashier@nethastock.com', v_hash, 'Claude', 'Caisse', r.id, v_site_id, TRUE
  FROM roles r WHERE r.name = 'cashier'
  ON CONFLICT (email) DO NOTHING;

  INSERT INTO users (email, password_hash, first_name, last_name, role_id, site_id, active)
  SELECT 'delivery@nethastock.com', v_hash, 'Dany', 'Livraison', r.id, v_site_id, TRUE
  FROM roles r WHERE r.name = 'delivery_agent'
  ON CONFLICT (email) DO NOTHING;

  INSERT INTO users (email, password_hash, first_name, last_name, role_id, site_id, active)
  SELECT 'maintenance@nethastock.com', v_hash, 'Marc', 'Support', r.id, v_site_id, TRUE
  FROM roles r WHERE r.name = 'maintenance'
  ON CONFLICT (email) DO NOTHING;
END $$;
