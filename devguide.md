# NethaStock – Guide de développement local

> Fichier interne – non commité (dans .gitignore)

---

## Lancer l'application

```bash
# Développement (nodemon – rechargement auto)
npm run dev

# Production
npm start
```

Le serveur démarre sur **http://localhost:4000**
Swagger UI disponible sur **http://localhost:4000/api-docs**

Au premier lancement, la base `nethastock` est créée automatiquement,
les tables sont générées et les données de test sont insérées.

---

## Lancer les tests Jest

```bash
# Tous les tests
npx jest --no-coverage

# Un module spécifique
npx jest tests/auth --no-coverage
npx jest tests/users --no-coverage
npx jest tests/sites --no-coverage
npx jest tests/roles --no-coverage
npx jest tests/categories --no-coverage
npx jest tests/products --no-coverage
npx jest tests/stocks --no-coverage
npx jest tests/movements --no-coverage
npx jest tests/inventory --no-coverage
npx jest tests/notifications --no-coverage
npx jest tests/auditLogs --no-coverage

# Avec couverture de code
npx jest --coverage
```

---

## Comptes de test (tous : mot de passe = noutong1)

| Email | Rôle |
|-------|------|
| naelle@nethastock.com | admin |
| admin@nethastock.com | admin |
| operator@nethastock.com | operator_stock |
| controller@nethastock.com | controller |
| manager@nethastock.com | site_manager |
| viewer@nethastock.com | viewer |
| decision@nethastock.com | decision_maker |
| accountant@nethastock.com | accountant |

---

## Tests Postman

Base URL : `http://localhost:4000/api/v1`

Pour les routes protégées, ajouter le header :
```
Authorization: Bearer <accessToken>
```

---

### AUTH

#### POST /auth/login
```json
{
  "email": "naelle@nethastock.com",
  "password": "noutong1"
}
```
Réponse : `{ accessToken, refreshToken, user }`

#### POST /auth/refresh
```json
{
  "refreshToken": "<refreshToken>"
}
```

#### POST /auth/logout
```
Header: Authorization: Bearer <accessToken>
Body: (vide)
```

#### GET /auth/me
```
Header: Authorization: Bearer <accessToken>
```

---

### SITES

#### GET /sites
```
(public, pas de token)
```

#### POST /sites  (admin)
```json
{
  "name": "Entrepôt Nord",
  "type": "entrepot",
  "city": "Douala",
  "country": "Cameroun",
  "responsible_name": "Jean Dupont",
  "responsible_email": "jean@example.com",
  "responsible_phone": "+237600000000"
}
```

#### PUT /sites/:id  (admin)
```json
{
  "name": "Entrepôt Nord Modifié",
  "type": "entrepot",
  "city": "Douala",
  "country": "Cameroun"
}
```

#### PATCH /sites/:id/toggle  (admin)
```json
{
  "active": false
}
```

---

### UTILISATEURS

#### GET /users  (admin)
```
?page=1&limit=20&role_id=1&active=true
```

#### POST /users  (admin)
```json
{
  "email": "nouveau@nethastock.com",
  "password": "noutong1",
  "first_name": "Nouveau",
  "last_name": "Utilisateur",
  "role_id": 2,
  "site_id": 1
}
```

#### PATCH /users/me/password
```json
{
  "old_password": "noutong1",
  "new_password": "nouveaumdp1"
}
```

#### PATCH /users/:id/toggle  (admin)
```json
{
  "active": false
}
```

---

### CATÉGORIES

#### GET /categories
```
?page=1&limit=20&site_id=1
```

#### POST /categories  (admin)
```json
{
  "name": "Électronique",
  "description": "Matériel électronique",
  "site_id": 1
}
```

#### PUT /categories/:id  (admin)
```json
{
  "name": "Électronique & Informatique",
  "description": "Matériel électronique et informatique"
}
```

---

### PRODUITS

#### GET /products
```
?q=cable&category_id=1&site_id=1&alert=false&page=1&limit=20
```

#### GET /products/alerts
```
?site_id=1
```

#### GET /products/scan/:barcode
```
GET /products/scan/1234567890123
```

#### GET /products/:id/qrcode

#### POST /products  (admin) — multipart/form-data
```
name: Câble HDMI 2.0
unit: piece
purchase_price: 2500
sale_price: 4000
category_id: 1
description: Câble HDMI haute vitesse
photo: (fichier image optionnel)
```

#### PUT /products/:id  (admin)
```json
{
  "name": "Câble HDMI 2.0 Pro",
  "unit": "piece",
  "purchase_price": 2500,
  "sale_price": 4500,
  "category_id": 1
}
```

#### PUT /products/:id/variants  (admin)
```json
{
  "variants": [
    { "type": "couleur", "value": "Noir", "sku_suffix": "BLK" },
    { "type": "taille", "value": "1m", "sku_suffix": "1M" },
    { "type": "taille", "value": "2m", "sku_suffix": "2M" }
  ]
}
```

---

### STOCKS

#### GET /stocks
```
?site_id=1&product_id=1&alert=true
```

#### GET /stocks/:productId/:siteId

#### POST /stocks/transfer  (admin/operator_stock/controller/site_manager)
```json
{
  "product_id": 1,
  "from_site_id": 1,
  "to_site_id": 2,
  "quantity": 5
}
```

---

### MOUVEMENTS

#### GET /movements
```
?type=entry&site_id=1&status=pending&date_from=2026-01-01&date_to=2026-12-31&page=1
```

#### GET /movements/pending  (admin)
```
?site_id=1
```

#### POST /movements/in
```json
{
  "product_id": 1,
  "site_id": 1,
  "quantity": 50,
  "motif": "Réception fournisseur",
  "supplier": "Fournisseur ABC"
}
```

#### POST /movements/out
```json
{
  "product_id": 1,
  "site_id": 1,
  "quantity": 10,
  "motif": "Sortie atelier"
}
```

#### POST /movements/transfer  (admin/operator_stock)
```json
{
  "from_site_id": 1,
  "to_site_id": 2,
  "items": [
    { "product_id": 1, "quantity": 5 },
    { "product_id": 2, "quantity": 3 }
  ],
  "motif": "Réapprovisionnement site 2"
}
```

#### PATCH /movements/:id/validate  (admin)
```
Body: (vide)
```

#### PATCH /movements/:id/reject  (admin)
```json
{
  "rejection_reason": "Quantité incorrecte, à resaisir"
}
```

---

### INVENTAIRE

#### GET /inventory/sessions
```
?site_id=1&status=in_progress&page=1
```

#### GET /inventory/sessions/active
```
(utilise le site_id du token)
```

#### POST /inventory/sessions  (admin/controller/site_manager)
```json
{
  "site_id": 1,
  "mode": "complet"
}
```
Mode tournant :
```json
{
  "site_id": 1,
  "mode": "tournant"
}
```

#### POST /inventory/sessions/:id/items
```json
{
  "product_id": 1,
  "counted_qty": 47
}
```

#### PUT /inventory/sessions/:id/items/:itemId
```json
{
  "counted_qty": 50
}
```

#### GET /inventory/sessions/:id/gaps

#### POST /inventory/sessions/:id/validate  (admin/controller)
```
Body: (vide)
```

#### POST /inventory/sessions/:id/close
```
Body: (vide)
```

---

### DOCUMENTS DE STOCK

#### GET /documents
```
?type=reception&site_id=1&status=draft
```

#### POST /documents
```json
{
  "type": "reception",
  "site_id": 1,
  "reference": "BON-2026-001",
  "notes": "Livraison fournisseur XYZ",
  "items": [
    { "product_id": 1, "quantity": 100, "unit_price": 2500 },
    { "product_id": 2, "quantity": 50,  "unit_price": 1500 }
  ]
}
```

Transfert :
```json
{
  "type": "transfert",
  "site_id": 1,
  "destination_site_id": 2,
  "reference": "TRF-2026-001",
  "items": [
    { "product_id": 1, "quantity": 20 }
  ]
}
```

#### POST /documents/:id/validate  (admin/controller)
```
Body: (vide)
```

---

### RAPPORTS

#### GET /reports/dashboard
```
?site_id=1
```

#### GET /reports/stock  (admin/decision_maker/accountant)
```
?site_id=1&category_id=1
```

#### GET /reports/movements  (admin/decision_maker/accountant)
```
?site_id=1&date_from=2026-01-01&date_to=2026-12-31&type=entry
```

#### GET /reports/alerts
```
?site_id=1
```

#### GET /reports/sites/stock  (admin/decision_maker/accountant)

#### GET /reports/inventory/:sessionId  (admin/controller)

#### GET /reports/export/stock  (admin/decision_maker/accountant)
```
?format=excel&site_id=1
?format=pdf&site_id=1
```

#### GET /reports/export/movements
```
?format=excel&date_from=2026-01-01&date_to=2026-12-31
?format=pdf
```

---

### NOTIFICATIONS

#### GET /notifications
```
?read=false&page=1
```

#### PATCH /notifications/:id/read

#### PATCH /notifications/read-all

#### POST /notifications/fcm-token
```json
{
  "fcm_token": "token_firebase_ici"
}
```

#### DELETE /notifications/:id

---

### AUDIT LOGS  (admin uniquement)

#### GET /audit-logs
```
?action=PRODUCT&entity_type=product&user_id=1&date_from=2026-01-01&page=1&limit=50
```

Valeurs utiles pour `action` :
- `CREATE_PRODUCT`, `UPDATE_PRODUCT`, `DELETE_PRODUCT`
- `CREATE_USER`, `UPDATE_USER`, `DEACTIVATE_USER`
- `CREATE_CATEGORY`, `UPDATE_CATEGORY`, `DELETE_CATEGORY`
- `VALIDATE_MOVEMENT`, `REJECT_MOVEMENT`
- `VALIDATE_INVENTORY`
- `CREATE_DOCUMENT`, `VALIDATE_DOCUMENT`

Valeurs pour `entity_type` :
- `product`, `user`, `category`, `movement`, `inventory_session`, `stock_document`

#### GET /audit-logs/summary
```
?date_from=2026-01-01&date_to=2026-12-31
```

#### GET /audit-logs/:id

---

### RÔLES

#### GET /roles
#### GET /roles/:id  (admin)

---

## Flux de test complet (ordre recommandé)

```
1. POST /auth/login          → récupérer accessToken + refreshToken
2. GET  /sites               → voir le site par défaut (id=1)
3. POST /categories          → créer une catégorie
4. POST /products            → créer un produit
5. POST /movements/in        → entrée de stock (status=pending)
6. PATCH /movements/:id/validate → valider → stock mis à jour
7. GET  /stocks?site_id=1    → vérifier le stock
8. POST /inventory/sessions  → démarrer un inventaire
9. POST /inventory/sessions/:id/items → saisir les quantités
10. GET /inventory/sessions/:id/gaps  → voir les écarts
11. POST /inventory/sessions/:id/validate → régulariser
12. GET /reports/dashboard   → voir les KPIs
13. GET /audit-logs          → voir toutes les actions loggées
```
