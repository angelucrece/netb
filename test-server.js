const express = require('express');
const app = express();
const PORT = 4000;

console.log("⚡ Démarrage du serveur test...");

app.get('/test-swagger', (req, res) => {
  res.send('Server OK');
});

app.listen(PORT, () => {
  console.log(`⚡ Serveur test actif sur http://localhost:${PORT}`);
});

// Capture les erreurs non gérées
process.on('uncaughtException', err => console.log('Erreur non capturée :', err));
process.on('unhandledRejection', err => console.log('Rejet non géré :', err));