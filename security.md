# Sécurité – Guide développeur

## Variables d'environnement

**Ne jamais committer le fichier `.env`** — il est dans `.gitignore`.

Pour démarrer :
```bash
cp .env.example .env
# Remplir toutes les valeurs CHANGE_ME
```

Générer des secrets JWT solides :
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Exécuter deux fois : un pour `JWT_SECRET`, un pour `JWT_REFRESH_SECRET` (ils doivent être différents).

## Comptes de test

Les comptes de test sont créés **sans mot de passe** par `seed.sql`.  
Pour les activer en développement local :

```bash
SEED_PASSWORD=monMotDePasseLocal node scripts/reset-test-passwords.js
```

- Ne jamais committer `SEED_PASSWORD` avec une vraie valeur.
- Ces comptes sont créés avec `active = FALSE` — le script les active uniquement en local.

## Si des secrets ont été exposés

Si un hash, un mot de passe ou un secret JWT a été commité par erreur :

1. **Révoquer immédiatement** : changer le mot de passe DB, régénérer les secrets JWT.
2. **Nettoyer l'historique Git** : `git filter-branch` ou `git-filter-repo`.
3. Notifier l'équipe.

## Headers de sécurité

Le middleware `helmet()` est appliqué dans `app.js` — il masque `X-Powered-By`  
et positionne les headers CSP, HSTS, etc.  
Ne jamais utiliser Express sans helmet en environnement exposé.