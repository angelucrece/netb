# NethaStock – Plan d'implémentation Backend

> Dépôt : https://github.com/angelucrece/NETHASTOCK-backend.git
> Stack : Node.js 20 · Express 5 · PostgreSQL 16 · JWT · Joi · bcrypt
> Convention commits : `feat:`, `fix:`, `refactor:`, `test:`, `chore:`
> ✅ = terminé · 🔄 = en cours · ⬜ = à faire

---

## Règles générales

- Chaque module = une branche dédiée
- On ne merge sur `main` que quand tous les tests passent
- Format de réponse uniforme : `{ success, data, message, pagination? }`
- Erreurs via classe `ApiError(statusCode, message, details?)`
- Toutes les routes protégées passent par `authenticate` → `authorize(roles)` → `validate(schema)`
- Requêtes SQL paramétrées uniquement (`$1, $2…`), jamais de concaténation

---

## MODULE 0 – Socle technique (infrastructure) ✅

**Branche :** `feat/core-infrastructure`
**Commit :** `feat: setup core infrastructure (app, server, db auto-init, middlewares, utils)`

### Tâches

- [x] Refactoriser `src/core/server.js` : séparation propre démarrage HTTP / connexion DB / graceful shutdown
- [x] Refactoriser `src/core/app.js` : helmet, cors, morgan, rate limiter global, montage routes sous `/api/v1`, handler 404, handler erreur global
- [x] `src/config/database.js` : pool pg propre + `initializeDatabase()` (crée DB + tables + seed au 1er lancement)
- [x] `src/config/upload.js` : config multer (photos produits, 5MB max, jpg/png/webp)
- [x] `src/config/logger.js` : instance Winston (console + fichier)
- [x] `src/config/swagger.js` : setup swagger-jsdoc + swagger-ui-express
- [x] `src/middleware/auth.js` : `authenticate` (vérifie JWT, charge user depuis DB, vérifie `active`)
- [x] `src/middleware/auth.js` : `authorize(...roles)` (RBAC, vérifie `req.user.role`)
- [x] `src/middleware/validation.js` : wrapper Joi générique `validate(schema)` → 422 formaté
- [x] `src/middleware/rateLimiter.js` : limiter global + limiter strict pour `/auth/login`
- [x] `src/utils/ApiError.js` : classe custom `ApiError extends Error`
- [x] `src/utils/ApiResponse.js` : helpers `success(res, data, msg, status)` et `error(res, msg, status)`
- [x] `src/utils/asyncHandler.js` : wrapper `try/catch` pour controllers async
- [x] `src/utils/paginate.js` : helper `paginate(page, limit, total)`
- [x] `src/utils/auditLog.js` : fonction `logAction(...)` pour la table audit_logs
- [x] `.env.example` : compléter avec toutes les variables nécessaires
- [x] `.gitignore` : ajouter `backend.md`, `gitbackend.md`, `*.log`, `uploads/`

---

## MODULE 1 – Base de données (schéma SQL)

**Branche :** `feat/database-schema`
**Commit :** `feat: add complete PostgreSQL schema (12 tables)`

### Tâches

- [ ] Créer `src/db/schema.sql` avec les 12 tables :
  - `roles` (id, name UK, label, description, level, created_at)
  - `sites` (id, name, type CHECK, address, city, postal_code, country, responsible_*, active, timestamps)
  - `users` (id, email UK, password_hash, first_name, last_name, role_id FK, site_id FK, active, refresh_token, fcm_token, last_login, timestamps)
  - `categories` (id, name, description, site_id FK nullable, active, timestamps)
  - `products` (id, sku UK, barcode UK, name, brand, unit, description, category_id FK, purchase_price, sale_price, photo_url, qr_code_url, active, timestamps)
  - `product_variants` (id, product_id FK, variant_type, variant_value, sku_suffix, created_at)
  - `product_stocks` (id, product_id FK, site_id FK, UNIQUE(product_id, site_id), quantity ≥ 0, min_stock, max_stock, location, updated_at)
  - `movements` (id, type CHECK, product_id FK, site_id FK, destination_site_id FK, quantity > 0, user_id FK, status DEFAULT 'pending', motif, supplier, validated_by FK, validated_at, rejection_reason, created_at)
  - `inventory_sessions` (id, site_id FK, mode CHECK, status CHECK, started_by FK, validated_by FK, started_at, ended_at)
  - `inventory_items` (id, session_id FK, product_id FK, theoretical_qty, counted_qty, gap GENERATED, counted_by FK, counted_at)
  - `notifications` (id, user_id FK, title, body, type, reference_id, reference_type, read DEFAULT false, created_at)
  - `audit_logs` (id, user_id FK, action, entity_type, entity_id, old_value JSONB, new_value JSONB, ip_address INET, created_at)
- [ ] Créer `src/db/seed.sql` : 7 rôles + 1 admin par défaut (password hashé)
- [ ] Créer `src/db/migrations/001_initial_schema.sql`

### Rôles à seeder

| name | label | level |
|------|-------|-------|
| admin | Administrateur | 1 |
| operator_stock | Opérateur Stock | 2 |
| controller | Contrôleur | 3 |
| site_manager | Responsable Site | 4 |
| viewer | Lecteur | 5 |
| decision_maker | Décideur | 6 |
| accountant | Comptable | 7 |

### Comptes de test à seeder

Un compte par rôle + 1 compte admin full-access pour Naelle.
Tous les mots de passe sont hashés avec bcrypt (salt=12) au moment du seed.

| email | password (clair) | rôle | prénom | nom |
|-------|-----------------|------|--------|-----|
| naelle@nethastock.com | noutong1 | admin | Naelle | Admin |
| admin@nethastock.com | noutong1 | admin | Super | Admin |
| operator@nethastock.com | noutong1 | operator_stock | Op | Stock |
| controller@nethastock.com | noutong1 | controller | Jean | Contrôleur |
| manager@nethastock.com | noutong1 | site_manager | Marie | Manager |
| viewer@nethastock.com | noutong1 | viewer | Paul | Viewer |
| decision@nethastock.com | noutong1 | decision_maker | Alice | Décideur |
| accountant@nethastock.com | noutong1 | accountant | Bob | Comptable |

### Initialisation automatique au démarrage

Le serveur doit, **au premier lancement** (ou si les tables sont absentes) :
1. Créer la base de données si elle n'existe pas (connexion initiale sur `postgres` DB)
2. Exécuter `schema.sql` (création des tables)
3. Exécuter `seed.sql` (rôles + site par défaut + comptes de test)

Implémentation dans `src/config/database.js` :
- Fonction `initializeDatabase()` appelée depuis `server.js` avant `app.listen`
- Vérifie l'existence de la table `roles` (sentinel check)
- Si absente → exécute schema + seed
- Log clair : `[DB] Base initialisée` ou `[DB] Base déjà existante`

---

## MODULE 2 – Authentification ✅

**Branche :** `feat/module-auth`
**Commit :** `feat: implement auth module (login, refresh, logout, JWT dual-token, RBAC)`

### Endpoints

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/api/v1/auth/login` | Public | Login → accessToken (15min) + refreshToken (7j) |
| POST | `/api/v1/auth/refresh` | Public | Renouvelle l'access token |
| POST | `/api/v1/auth/logout` | JWT | Invalide le refresh token |

### Tâches

- [ ] `AuthService.login` : vérif email+password+site_id, bcrypt.compare, génère accessToken (15min) + refreshToken (7j), stocke refreshToken hashé en DB, met à jour `last_login`
- [ ] `AuthService.refresh` : vérifie refreshToken en DB, génère nouveau accessToken
- [ ] `AuthService.logout` : supprime refreshToken de la DB
- [ ] `AuthController` : handlers login / refresh / logout avec `asyncHandler`
- [ ] `AuthValidation` : schémas Joi pour login (email, password, site_id requis) et refresh (refreshToken requis)
- [ ] `AuthRoute` : montage avec `authLimiter` sur login, `validate` sur chaque route
- [ ] Payload JWT : `{ id, email, role: { id, name }, site_id, iat, exp }`
- [ ] Tests unitaires : `tests/auth/auth.service.test.js`
  - [ ] login succès → retourne tokens
  - [ ] login email inexistant → erreur 401
  - [ ] login mauvais password → erreur 401
  - [ ] login compte inactif → erreur 401
  - [ ] refresh token valide → nouveau accessToken
  - [ ] refresh token invalide → erreur 401
  - [ ] logout → refreshToken supprimé

---

## MODULE 3 – Rôles ✅

**Branche :** `feat/module-roles-sites`
**Commit :** `feat: implement roles and sites modules (CRUD, toggle, soft-delete, tests)`

### Endpoints

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/v1/roles` | JWT | Liste des 7 rôles |
| GET | `/api/v1/roles/:id/permissions` | Admin | Permissions d'un rôle |

### Tâches

- [ ] `RoleRepository.findAll` / `findById`
- [ ] `RoleService.getRoles` / `getRoleById`
- [ ] `RoleController` + `RoleRoute`
- [ ] Tests : `tests/roles/role.service.test.js`
  - [ ] liste retourne 7 rôles
  - [ ] findById existant → retourne rôle
  - [ ] findById inexistant → erreur 404

---

## MODULE 4 – Sites ✅

**Branche :** `feat/module-roles-sites`
**Commit :** `feat: implement roles and sites modules (CRUD, toggle, soft-delete, tests)`

### Endpoints

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/v1/sites` | Public | Liste sites actifs (dropdown login) |
| GET | `/api/v1/sites/:id` | JWT | Détail site + stats stock |
| POST | `/api/v1/sites` | Admin | Créer un site |
| PUT | `/api/v1/sites/:id` | Admin | Modifier un site |
| PATCH | `/api/v1/sites/:id/toggle` | Admin | Activer/désactiver |
| DELETE | `/api/v1/sites/:id` | Admin | Soft delete (si aucun stock) |

### Tâches

- [ ] `SiteRepository` : findAll, findById, create, update, softDelete, hasStock
- [ ] `SiteService` : logique métier (vérif stock avant delete)
- [ ] `SiteValidation` : schémas Joi create/update
- [ ] `SiteController` + `SiteRoute`
- [ ] Tests : `tests/sites/site.service.test.js`
  - [ ] create → site créé
  - [ ] delete avec stock → erreur 409
  - [ ] toggle → active inversé

---

## MODULE 5 – Utilisateurs ✅

**Branche :** `feat/module-users`
**Commit :** `feat: implement users module (CRUD, password change, toggle, soft-delete, audit log)`

### Endpoints

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/v1/users` | Admin | Liste paginée (filtres: role_id, site_id, active) |
| GET | `/api/v1/users/me` | JWT | Profil connecté |
| GET | `/api/v1/users/:id` | Admin | Détail utilisateur |
| POST | `/api/v1/users` | Admin | Créer compte (hash mdp, assigne rôle+site) |
| PUT | `/api/v1/users/:id` | Admin | Modifier (sauf mdp) |
| PATCH | `/api/v1/users/me/password` | JWT | Changer son propre mdp |
| PATCH | `/api/v1/users/:id/toggle` | Admin | Activer/désactiver |
| DELETE | `/api/v1/users/:id` | Admin | Soft delete |

### Tâches

- [ ] `UserRepository` : findAll (avec jointures roles+sites), findById, create, update, softDelete, updatePassword
- [ ] `UserService` : bcrypt hash (salt=12), vérif email unique, vérif rôle+site existent, log audit
- [ ] `UserValidation` : schémas Joi create/update/changePassword
- [ ] `UserController` + `UserRoute`
- [ ] Tests : `tests/users/user.service.test.js`
  - [ ] create → user créé avec mdp hashé
  - [ ] create email dupliqué → erreur 409
  - [ ] changePassword mauvais ancien mdp → erreur 400
  - [ ] toggle → active inversé

---

## MODULE 6 – Catégories ✅

**Branche :** `feat/module-categories-products-stocks`
**Commit :** `feat: implement categories, products (QR, scan, variants, photo) and stocks (transfer) modules`

### Endpoints

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/v1/categories` | JWT | Liste avec compteur produits |
| GET | `/api/v1/categories/:id` | JWT | Détail + produits |
| POST | `/api/v1/categories` | Admin | Créer |
| PUT | `/api/v1/categories/:id` | Admin | Modifier |
| DELETE | `/api/v1/categories/:id` | Admin | Supprimer si aucun produit |

### Tâches

- [ ] `CategoryRepository` : findAll (avec count produits), findById, create, update, delete, hasProducts
- [ ] `CategoryService` : vérif produits avant delete
- [ ] `CategoryValidation` + `CategoryController` + `CategoryRoute`
- [ ] Tests : `tests/categories/category.service.test.js`
  - [ ] delete avec produits → erreur 409
  - [ ] create → catégorie créée

---

## MODULE 7 – Produits ✅

**Branche :** `feat/module-categories-products-stocks`
**Commit :** `feat: implement categories, products (QR, scan, variants, photo) and stocks (transfer) modules`

### Endpoints

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/v1/products` | JWT | Liste paginée (q, category_id, site_id, alert, page, limit) |
| GET | `/api/v1/products/:id` | JWT | Détail + stock + variantes + historique récent |
| GET | `/api/v1/products/scan/:barcode` | JWT | Recherche par code-barres/QR |
| GET | `/api/v1/products/:id/qrcode` | JWT | QR code base64 PNG |
| GET | `/api/v1/products/alerts` | JWT | Produits sous seuil minimum |
| POST | `/api/v1/products` | Admin | Créer (upload photo, génération QR) |
| PUT | `/api/v1/products/:id` | Admin | Modifier |
| PATCH | `/api/v1/products/:id/photo` | Admin | Upload/remplacer photo |
| DELETE | `/api/v1/products/:id` | Admin | Soft delete |
| PUT | `/api/v1/products/:id/variants` | Admin | Gérer variantes |

### Tâches

- [ ] `ProductRepository` : findAll (avec stock par site), findById, findByBarcode, create, update, softDelete, findAlerts
- [ ] `ProductService` : génération SKU auto (`REF-YYYY-XXXX`), génération QR code (qrcode pkg), upload photo via multer, vérif SKU/barcode unique
- [ ] `ProductValidation` + `ProductController` + `ProductRoute`
- [ ] Installer `qrcode` : `npm install qrcode`
- [ ] Tests : `tests/products/product.service.test.js`
  - [ ] create → produit créé avec QR
  - [ ] scan barcode existant → retourne produit
  - [ ] scan barcode inexistant → 404
  - [ ] alerts → produits sous seuil

---

## MODULE 8 – Stocks ✅

**Branche :** `feat/module-categories-products-stocks`
**Commit :** `feat: implement categories, products (QR, scan, variants, photo) and stocks (transfer) modules`

### Endpoints (intégrés dans products et movements)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/v1/stocks` | JWT | Stock par site (filtres) |
| GET | `/api/v1/stocks/:productId/:siteId` | JWT | Stock d'un produit sur un site |
| POST | `/api/v1/stocks/transfer` | Op.Stock+ | Transfert inter-sites (atomique) |

### Tâches

- [ ] `StockRepository` : getAll, getByProductAndSite, upsert (INSERT ON CONFLICT UPDATE), adjustQuantity
- [ ] `StockService` : vérif stock disponible avant sortie/transfert, transaction atomique pour transfert
- [ ] `StockController` + `StockRoute`
- [ ] Tests : `tests/stocks/stock.service.test.js`
  - [ ] transfert stock suffisant → succès
  - [ ] transfert stock insuffisant → erreur 400
  - [ ] upsert → crée si inexistant, met à jour si existant

---

## MODULE 9 – Mouvements de stock ✅

**Branche :** `feat/module-movements-inventory-reports-notifications`
**Commit :** `feat: implement movements, inventory, documents, reports and notifications modules`

### Endpoints

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/v1/movements` | JWT | Historique filtrable (type, site, user, produit, dates, statut) |
| GET | `/api/v1/movements/:id` | JWT | Détail mouvement |
| GET | `/api/v1/movements/pending` | Admin | File d'attente validation |
| POST | `/api/v1/movements/in` | JWT | Réception stock (entrée) |
| POST | `/api/v1/movements/out` | JWT | Sortie stock (contrôle dispo) |
| POST | `/api/v1/movements/transfer` | Op.Stock+ | Transfert inter-sites (atomique) |
| PATCH | `/api/v1/movements/:id/validate` | Admin | Valider mouvement |
| PATCH | `/api/v1/movements/:id/reject` | Admin | Rejeter mouvement |

### Tâches

- [ ] `MovementRepository` : findAll (paginé, filtres), findById, create, updateStatus, findPending
- [ ] `MovementService` :
  - entrée → crée mouvement `pending`, si validé → `product_stocks.quantity += qty`
  - sortie → vérifie stock dispo, crée mouvement `pending`
  - transfert → transaction atomique (sortie site A + entrée site B)
  - validate → met à jour stock + status `validated`
  - reject → status `rejected` + motif
- [ ] `MovementValidation` + `MovementController` + `MovementRoute`
- [ ] Tests : `tests/movements/movement.service.test.js`
  - [ ] entrée → mouvement créé
  - [ ] sortie stock insuffisant → erreur 400
  - [ ] transfert → atomique (rollback si erreur)
  - [ ] validate → stock mis à jour
  - [ ] reject → status rejected

---

## MODULE 10 – Inventaire ✅

**Branche :** `feat/module-movements-inventory-reports-notifications`
**Commit :** `feat: implement movements, inventory, documents, reports and notifications modules`

### Endpoints

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/v1/inventory/sessions` | Ctrl/Admin | Liste sessions |
| GET | `/api/v1/inventory/sessions/:id` | Ctrl/Admin | Détail session + articles + écarts |
| GET | `/api/v1/inventory/sessions/active` | JWT | Session en cours sur mon site |
| POST | `/api/v1/inventory/sessions` | Ctrl/Admin | Démarrer session (complet/tournant) |
| POST | `/api/v1/inventory/sessions/:id/items` | JWT | Saisir quantité comptée |
| PUT | `/api/v1/inventory/sessions/:id/items/:itemId` | JWT | Corriger saisie |
| GET | `/api/v1/inventory/sessions/:id/gaps` | Ctrl/Admin | Calculer écarts |
| POST | `/api/v1/inventory/sessions/:id/validate` | Ctrl/Admin | Valider + régulariser stock (atomique) |
| POST | `/api/v1/inventory/sessions/:id/close` | Ctrl/Admin | Fermer sans régulariser |

### Tâches

- [ ] `InventoryRepository` : sessions CRUD, items CRUD, findActive
- [ ] `InventoryService` :
  - démarrage : snapshot `theoretical_qty` depuis `product_stocks`
  - saisie : enregistre `counted_qty`
  - gaps : calcule `counted_qty - theoretical_qty`
  - validate : transaction atomique → ajuste `product_stocks` + crée mouvements `adjustment` + status `validated`
- [ ] `InventoryValidation` + `InventoryController` + `InventoryRoute`
- [ ] Tests : `tests/inventory/inventory.service.test.js`
  - [ ] démarrer session → snapshot créé
  - [ ] saisie → item enregistré
  - [ ] gaps → écarts calculés correctement
  - [ ] validate → stock ajusté + mouvements créés

---

## MODULE 11 – Documents de stock ✅

**Branche :** `feat/module-movements-inventory-reports-notifications`
**Commit :** `feat: implement movements, inventory, documents, reports and notifications modules`

### Tâches

- [ ] Définir le modèle `stock_documents` (bon de réception, bon de sortie, bon de transfert)
- [ ] `StockDocumentRepository` + `StockDocumentService`
- [ ] Génération PDF (via `pdfkit` ou `puppeteer`) pour chaque type de document
- [ ] `StockDocumentController` + `StockDocumentRoute`
- [ ] Tests : `tests/stockDocuments/stockDocument.service.test.js`

---

## MODULE 12 – Rapports & Dashboard ✅

**Branche :** `feat/module-movements-inventory-reports-notifications`
**Commit :** `feat: implement movements, inventory, documents, reports and notifications modules`

### Endpoints

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/v1/reports/dashboard` | JWT | KPIs globaux |
| GET | `/api/v1/reports/stock` | Admin/Décideur | État stock par site |
| GET | `/api/v1/reports/movements` | Admin/Décideur | Rapport mouvements sur période |
| GET | `/api/v1/reports/alerts` | JWT | Articles critiques |
| GET | `/api/v1/reports/sites/stock` | Admin/Décideur | Comparatif stocks par magasin |
| GET | `/api/v1/reports/inventory/:sessionId` | Ctrl/Admin | Rapport session inventaire |
| GET | `/api/v1/reports/export/stock` | Admin/Décideur | Export PDF/Excel état stock |
| GET | `/api/v1/reports/export/movements` | Admin/Décideur | Export PDF/Excel mouvements |

### Tâches

- [ ] `ReportRepository` : requêtes SQL d'agrégation (GROUP BY, SUM, COUNT)
- [ ] `ReportService` : assemblage des données dashboard, génération PDF (pdfkit), génération Excel (exceljs)
- [ ] `ReportController` + `ReportRoute`
- [ ] Installer : `npm install pdfkit exceljs`
- [ ] Tests : `tests/reports/report.service.test.js`
  - [ ] dashboard → retourne KPIs
  - [ ] export stock → buffer PDF/Excel généré

---

## MODULE 13 – Notifications ✅

**Branche :** `feat/module-movements-inventory-reports-notifications`
**Commit :** `feat: implement movements, inventory, documents, reports and notifications modules`

### Endpoints

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/v1/notifications` | JWT | Mes notifications (avec count non lues) |
| PATCH | `/api/v1/notifications/:id/read` | JWT | Marquer comme lue |
| PATCH | `/api/v1/notifications/read-all` | JWT | Tout marquer comme lu |
| POST | `/api/v1/notifications/fcm-token` | JWT | Enregistrer token FCM |
| DELETE | `/api/v1/notifications/:id` | JWT | Supprimer |

### Tâches

- [ ] `NotificationRepository` : findByUser, create, markRead, markAllRead, delete
- [ ] `NotificationService` : création auto (alertes stock bas, mouvements en attente), envoi FCM (firebase-admin)
- [ ] `NotificationController` + `NotificationRoute`
- [ ] Installer : `npm install firebase-admin`
- [ ] Tests : `tests/notifications/notification.service.test.js`
  - [ ] create → notification créée
  - [ ] markRead → read = true
  - [ ] markAllRead → toutes lues

---

## MODULE 14 – Audit Logs ✅

**Branche :** `feat/module-audit-logs`
**Commit :** `feat: implement audit logs module (list, filter, summary, detail)`

### Endpoints

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/v1/audit-logs` | Admin | Liste paginée (filtres: user_id, action, entity_type, dates) |
| GET | `/api/v1/audit-logs/summary` | Admin | Compteurs par type d'action |
| GET | `/api/v1/audit-logs/:id` | Admin | Détail d'un log (old_value / new_value) |

### Tâches

- [x] `AuditLogRepository` : findAll (filtres + pagination), count, findById, getSummary
- [x] `AuditLogService` : getLogs, getById, getSummary
- [x] `AuditLogController` + `AuditLogRoute` (admin uniquement)
- [x] `src/utils/auditLog.js` : `logAction(...)` intégré dans tous les modules
- [x] Actions loggées : CREATE_USER, UPDATE_USER, DEACTIVATE_USER, CREATE_PRODUCT, UPDATE_PRODUCT, DELETE_PRODUCT, CREATE_CATEGORY, UPDATE_CATEGORY, DELETE_CATEGORY, VALIDATE_MOVEMENT, REJECT_MOVEMENT, VALIDATE_INVENTORY, CREATE_DOCUMENT, VALIDATE_DOCUMENT
- [x] Tests : `tests/auditLogs/auditLog.service.test.js` (5 tests)

---

## Ordre d'implémentation recommandé

```
0. Socle technique
1. Schéma DB
2. Auth
3. Rôles
4. Sites
5. Utilisateurs
6. Catégories
7. Produits
8. Stocks
9. Mouvements
10. Inventaire
11. Documents
12. Rapports
13. Notifications
14. Audit (intégré au fil des modules)
```

---

## Dépendances à installer

```bash
npm install qrcode pdfkit exceljs firebase-admin helmet morgan
```

---

## Variables d'environnement requises (.env)

```env
# Serveur
PORT=4000
NODE_ENV=development

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nethastock
DB_USERNAME=postgres
DB_PASSWORD=noutong1

# JWT
JWT_SECRET=your_super_secret_minimum_32_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret_minimum_32_chars
JWT_REFRESH_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=10

# Logs
LOG_LEVEL=info

# Upload
UPLOAD_MAX_SIZE_MB=5

# Firebase (notifications push)
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
```
