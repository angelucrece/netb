# Cahier de charges mis a jour - NETHASTOCK

## Perimetre realise

Le backend couvre maintenant la V1 MVP et une partie de la V2:

- Produits, categories, variantes, codes-barres et QR codes
- Stock multi-sites, seuils, emplacements, alertes
- Mouvements stock: reception, sortie, transfert, validation/rejet
- Inventaires complets/tournants, ecarts et regularisation
- Utilisateurs, roles, authentification JWT
- Mouchard/audit logs
- Rapports dashboard, stocks, mouvements, exports PDF/Excel
- Fournisseurs, commandes d'achat et reception fournisseur
- Clients, ventes, livraisons, factures, paiements et caisse

## Roles retenus

| Role backend | Role cahier de charges | Acces principal |
| --- | --- | --- |
| `admin` | Administrateur | Gestion complete, utilisateurs, parametrage, audit |
| `controller` | Controleur | Inventaires, ecarts, validation mouvements/documents |
| `commercial` | Operateur Vente | Clients, ventes, livraisons, factures, consultation stock |
| `operator_stock` | Operateur Stock | Produits, reception/sortie, inventaire, transferts, preparation |
| `maintenance` | Charge de Maintenance | Compte prevu pour support technique et fiabilite |
| `decision_maker` | Decideur | Tableaux de bord, synthese, rapports analytiques |
| `accountant` | Comptable | Factures, paiements, caisse, exports financiers |
| `buyer` | Extension V2 Achats | Fournisseurs, commandes achat, receptions |
| `cashier` | Extension caisse | Ouverture/fermeture caisse, encaissements |
| `delivery_agent` | Extension livraison | Bons de livraison, depart, confirmation livraison |
| `site_manager` | Extension responsable site | Operations sur son site, stock, inventaire, livraisons |
| `viewer` | Consultation | Consultation simple |

## Matrice de droits backend

| Module | Roles autorises |
| --- | --- |
| Utilisateurs | `admin` |
| Roles | Lecture: connectes, detail: `admin` |
| Sites | Lecture publique/connexion, gestion: `admin` |
| Produits et categories | Lecture: connectes, creation/modification: `admin`, `operator_stock`, `site_manager`, suppression: `admin` |
| Stock et transferts | `admin`, `operator_stock`, `controller`, `site_manager` |
| Mouvements stock | Lecture: connectes, creation/transfer/validation: `admin`, `operator_stock`, `controller`, `site_manager` |
| Documents stock | Creation: `admin`, `operator_stock`, `site_manager`, validation: `admin`, `controller`, `site_manager` |
| Inventaire | Saisie/session: `admin`, `operator_stock`, `controller`, `site_manager`, validation/regularisation: `admin`, `controller`, `site_manager` |
| Fournisseurs | `admin`, `buyer`, `site_manager` |
| Achats | Gestion: `admin`, `buyer`, `operator_stock`, `site_manager`, reception: + `controller` |
| Clients | `admin`, `commercial`, `site_manager`, `cashier` |
| Ventes | `admin`, `commercial`, `site_manager`, `cashier`, `operator_stock` |
| Livraisons | `admin`, `commercial`, `site_manager`, `delivery_agent`, `operator_stock` |
| Factures | Emission: `admin`, `commercial`, `accountant`, consultation: + `cashier` |
| Paiements | `admin`, `cashier`, `accountant` |
| Caisse | `admin`, `cashier`, `accountant` |
| Rapports avances | `admin`, `decision_maker`, `accountant` |
| Rapport inventaire | `admin`, `controller` |
| Audit logs | `admin` |

## Points a traiter dans une version ulterieure

- Microservices NestJS stricts: le backend actuel est Express/CommonJS, structure modulaire, pas encore NestJS.
- Synchronisation offline complete cote mobile.
- Push notifications PWA/SMS/email reelles.
- Suggestions de reapprovisionnement basees sur historique et saisonnalite.
- Monitoring 24/7, replication et load balancing production.
