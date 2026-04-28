# NethaStock – Journal des commits de correction

> Ce fichier trace les commits de correction sur des modules déjà pushés.
> Format : `type(module): description` · date · branche concernée

---

## Corrections en attente

_(aucune pour l'instant)_

---

## Corrections effectuées

_(aucune pour l'instant)_

---

## Exemples de format

```
fix(auth): correction erreur 401 sur refresh token expiré
  - Branche : feat/module-auth
  - Date : 2026-04-27
  - Détail : le middleware ne distinguait pas token expiré vs token invalide

fix(products): correction upload photo échoue si dossier uploads absent
  - Branche : feat/module-products
  - Date : 2026-04-27
  - Détail : ajout création automatique du dossier uploads/products au démarrage

refactor(stocks): renommer getByProductAndSite → findByProductAndSite (convention)
  - Branche : feat/module-stocks
  - Date : 2026-04-27
```
