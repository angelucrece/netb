
/**
 * test-server.js – serveur minimal de vérification Swagger.
 * Utilisation : node test-server.js
 * NE PAS déployer en production.
 */
'use strict';

require('dotenv').config();
const express = require('express');
const helmet  = require('helmet');

const app  = express();
const PORT = process.env.PORT || 4000;

// Masque l'en-tête X-Powered-By et applique les headers de sécurité
app.use(helmet());

app.get('/test-swagger', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Serveur test actif sur http://localhost:${PORT}`);
});

// Capture les erreurs non gérées sans exposer les détails en sortie standard
process.on('uncaughtException',  (err) => console.error('[uncaughtException]',  err.message));
process.on('unhandledRejection', (err) => console.error('[unhandledRejection]', err));