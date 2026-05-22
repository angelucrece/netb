-- Libelles alignes avec le cahier de charges.

UPDATE roles SET label = 'Operateur Vente',
  description = 'Gestion devis, ventes, factures et consultation stock'
WHERE name = 'commercial';

UPDATE roles SET label = 'Operateur Stock',
  description = 'Reception, preparation, inventaire et transferts'
WHERE name = 'operator_stock';

UPDATE roles SET label = 'Controleur',
  description = 'Inventaire, regularisation stock et controle qualite'
WHERE name = 'controller';

UPDATE roles SET label = 'Decideur',
  description = 'Tableaux de bord, synthese et rapports analytiques'
WHERE name = 'decision_maker';

UPDATE roles SET label = 'Comptable',
  description = 'Gestion financiere, clotures et rapprochements'
WHERE name = 'accountant';
