# Guide de verification du backend NethaStock

Ce guide explique comment verifier que le backend fonctionne avec Swagger ou Postman.
Il suit les principaux flux metier: connexion, reception fournisseur, vente client,
livraison, facturation, paiement, caisse et transfert inter-sites.

## 1. Demarrer le backend

Verifier le fichier `.env`, puis lancer:

```bash
npm install
npm run dev
```

Par defaut, l'API ecoute sur:

```text
http://localhost:4000
```

Verifier l'etat du serveur:

```http
GET http://localhost:4000/api/health
```

La reponse attendue contient:

```json
{
  "success": true
}
```

## 2. Tester avec Swagger

Ouvrir:

```text
http://localhost:4000/api-docs
```

Faire d'abord une connexion:

```http
POST /api/v1/auth/login
Content-Type: application/json
```

Exemple:

```json
{
  "email": "admin@nethastock.com",
  "password": "noutong1"
}
```

Copier le `accessToken` retourne dans `data.accessToken`, puis cliquer sur
`Authorize` dans Swagger et saisir:

```text
Bearer VOTRE_ACCESS_TOKEN
```

Toutes les routes protegees peuvent ensuite etre testees.

## 3. Tester avec Postman

Creer un environnement Postman:

```text
base_url = http://localhost:4000
accessToken =
site_id = 1
```

Dans la requete de login, ajouter ce script dans l'onglet `Tests`:

```javascript
const json = pm.response.json();
pm.environment.set("accessToken", json.data.accessToken);
pm.environment.set("refreshToken", json.data.refreshToken);
```

Pour les autres requetes, utiliser l'authorization:

```text
Type: Bearer Token
Token: {{accessToken}}
```

## 4. Scenario A: reception fournisseur et reapprovisionnement stock

Objectif: verifier qu'une reception fournisseur ajoute le stock.

1. Creer ou recuperer un fournisseur:

```http
GET {{base_url}}/api/v1/suppliers
```

2. Creer une commande achat:

```http
POST {{base_url}}/api/v1/purchases
Content-Type: application/json
```

```json
{
  "supplier_id": 1,
  "site_id": 1,
  "reference": "BC-FOURN-001",
  "items": [
    {
      "product_id": 1,
      "quantity": 20,
      "unit_price": 5000
    }
  ]
}
```

3. Marquer la commande comme envoyee:

```http
PATCH {{base_url}}/api/v1/purchases/1/order
```

4. Receptionner:

```http
POST {{base_url}}/api/v1/purchases/1/receive
Content-Type: application/json
```

```json
{
  "notes": "Reception fournisseur complete"
}
```

5. Verifier le stock:

```http
GET {{base_url}}/api/v1/stocks?site_id=1&product_id=1
```

Resultat attendu: la quantite du produit a augmente.

## 5. Scenario B: vente client entreprise, livraison, facture, paiement differe

Objectif: verifier le flux client entreprise.

1. Creer un client entreprise:

```http
POST {{base_url}}/api/v1/clients
Content-Type: application/json
```

```json
{
  "type": "company",
  "name": "Entreprise Demo SARL",
  "contact_name": "Responsable achats",
  "phone": "+237690000000",
  "payment_terms_days": 30,
  "discount_rate": 5
}
```

2. Creer une vente:

```http
POST {{base_url}}/api/v1/sales
Content-Type: application/json
```

```json
{
  "client_id": 1,
  "site_id": 1,
  "channel": "company",
  "reference": "BC-CLIENT-001",
  "delivery_required": true,
  "delivery_fee": 0,
  "discount_amount": 1000,
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "unit_price": 10000
    }
  ]
}
```

3. Confirmer la vente:

```http
POST {{base_url}}/api/v1/sales/1/confirm
```

Resultat attendu: le stock diminue.

4. Creer le bon de livraison:

```http
POST {{base_url}}/api/v1/sales/1/delivery
Content-Type: application/json
```

```json
{
  "reference": "BL-001",
  "notes": "Livraison client entreprise"
}
```

5. Demarrer puis valider la livraison:

```http
PATCH {{base_url}}/api/v1/sales/deliveries/1/start
PATCH {{base_url}}/api/v1/sales/deliveries/1/delivered
```

6. Emettre la facture:

```http
POST {{base_url}}/api/v1/sales/1/invoice
```

Resultat attendu: la facture contient une date d'echeance basee sur les conditions
du client, par exemple 30 jours.

7. Enregistrer un paiement:

```http
POST {{base_url}}/api/v1/sales/invoices/1/payments
Content-Type: application/json
```

```json
{
  "amount": 19000,
  "mode": "bank_transfer",
  "type": "invoice",
  "reference": "VIR-001"
}
```

## 6. Scenario C: client occasionnel avec paiement en deux temps

Le backend actuel permet de stocker des paiements de type `deposit` et `balance`,
mais il ne force pas encore la regle "50% avant livraison, 50% a la livraison".
Il faut donc verifier ce flux manuellement aujourd'hui, ou ajouter une vraie regle
metier dans le service de vente.

Exemple de vente occasionnelle:

```http
POST {{base_url}}/api/v1/sales
Content-Type: application/json
```

```json
{
  "site_id": 1,
  "channel": "occasional",
  "client_name": "Client Passage",
  "client_phone": "+237690111111",
  "delivery_required": true,
  "delivery_fee": 2000,
  "items": [
    {
      "product_id": 1,
      "quantity": 1,
      "unit_price": 10000
    }
  ]
}
```

Point important: dans le code actuel, le paiement est rattache a une facture.
Pour accepter un acompte avant livraison, il faudra adapter le backend pour
autoriser un paiement sur commande avant emission de facture.

## 7. Scenario D: caisse et paiement sur place

Pour les paiements physiques ou mobile money encaisses par le caissier, ouvrir
d'abord une session de caisse:

```http
POST {{base_url}}/api/v1/cash/sessions/open
Content-Type: application/json
```

```json
{
  "site_id": 1,
  "opening_balance": 50000,
  "notes": "Ouverture caisse du matin"
}
```

Puis enregistrer le paiement de facture:

```http
POST {{base_url}}/api/v1/sales/invoices/1/payments
Content-Type: application/json
```

```json
{
  "amount": 10000,
  "mode": "orange_money",
  "type": "invoice",
  "reference": "OM-TRANS-001"
}
```

Fermer la caisse:

```http
POST {{base_url}}/api/v1/cash/sessions/1/close
Content-Type: application/json
```

```json
{
  "closing_balance": 60000,
  "notes": "Cloture caisse"
}
```

## 8. Scenario E: transfert entre sites

```http
POST {{base_url}}/api/v1/movements/transfer
Content-Type: application/json
```

```json
{
  "from_site_id": 1,
  "to_site_id": 2,
  "motif": "Reapprovisionnement magasin",
  "items": [
    {
      "product_id": 1,
      "quantity": 3
    }
  ]
}
```

Verifier ensuite:

```http
GET {{base_url}}/api/v1/stocks?product_id=1
```

## 9. Paiements par API externe: ce qui existe et ce qui manque

Le backend sait deja enregistrer plusieurs modes de paiement:

```text
cash, orange_money, mtn_money, card, bank_transfer, cheque, credit
```

Mais il ne contacte pas encore les API Orange Money, MTN MoMo ou carte bancaire.
Actuellement, `orange_money` et `mtn_money` sont seulement des libelles internes.

Pour une vraie integration, il faut ajouter:

1. Un service `PaymentGatewayService`.
2. Une table `payment_transactions` avec `provider`, `provider_reference`,
   `status`, `amount`, `invoice_id`, `sale_order_id`, `raw_response`.
3. Une route pour initialiser le paiement.
4. Une route webhook par fournisseur.
5. Une verification de signature webhook.
6. Une logique d'idempotence pour eviter les doubles paiements.

Flux recommande:

```text
Frontend/Postman -> Backend initie paiement -> API fournisseur
API fournisseur -> Webhook backend -> backend confirme paiement -> facture mise a jour
```

Ne jamais marquer une facture comme payee uniquement parce que le frontend dit
que le paiement a reussi. La confirmation fiable doit venir du webhook signe.

## 10. Checks rapides apres chaque test

Verifier les stocks:

```http
GET {{base_url}}/api/v1/stocks?site_id=1
```

Verifier les mouvements:

```http
GET {{base_url}}/api/v1/movements
```

Verifier les factures:

```http
GET {{base_url}}/api/v1/sales/invoices
```

Verifier les paiements:

```http
GET {{base_url}}/api/v1/cash/payments
```

Verifier les logs:

```http
GET {{base_url}}/api/v1/audit-logs
```
