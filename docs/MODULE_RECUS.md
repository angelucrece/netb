# Module recus automatiques

Ce module cree automatiquement un recu apres chaque paiement confirme.

## Declenchement

- Paiement manuel: `POST /api/v1/payments/invoices/:invoiceId/manual`
- Paiement externe: quand `GET /api/v1/payments/transactions/:id/status` recoit le statut `succeeded`

Dans les deux cas, `PaymentService.applyConfirmedPayment()` enregistre le paiement, met a jour la facture et la vente, puis appelle `ReceiptService.generateForPayment()`.

## Donnees conservees

Le recu garde un snapshot JSON complet dans `receipts.payload`:

- informations paiement: mode, reference, date, montant impute, montant recu, montant rendu/rembourse;
- informations transaction: facture, vente, date et lieu;
- client: nom, telephone, adresse si disponible;
- caissier: nom et email si disponible;
- produits: SKU, nom, prix unitaire, quantite, remise, total ligne;
- signatures: texte ou image `data:image/...;base64,...` si le frontend les transmet.

Ce snapshot evite qu'un ancien recu change si un produit, un client ou un site est modifie plus tard.

## Export PDF

- Liste des recus: `GET /api/v1/receipts`
- Recu par id: `GET /api/v1/receipts/:id`
- Recu par paiement: `GET /api/v1/receipts/payments/:paymentId`
- Export PDF: `GET /api/v1/receipts/:id/pdf`

Le PDF contient les produits, les montants, le lieu, le client, le caissier et les zones de signature.
