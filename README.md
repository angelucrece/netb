# NethaStock backend

API Node/Express pour la gestion centralisee des stocks, achats, ventes,
livraisons, factures, paiements et caisse.

## Installation

```bash
npm install
```

## Lancement

```bash
npm run dev
```

ou:

```bash
npm start
```

La documentation Swagger est exposee sur:

```text
http://localhost:4000/api-docs
```

## Tests

```bash
npm test
```

## Modules principaux

- Authentification, roles, utilisateurs et sites
- Produits, categories, stocks, mouvements et inventaires
- Fournisseurs et commandes d'achat avec reception stock
- Clients, ventes, livraisons, factures et paiements
- Sessions de caisse et synthese des encaissements
- Rapports dashboard, stock, mouvements et exports

## Comptes de test

Le seed cree plusieurs comptes. Le mot de passe par defaut est:

```text
noutong1
```
