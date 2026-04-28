require('dotenv').config();
const app = require('./app');
const { initializeDatabase, testConnection, close } = require('../config/database');
const logger = require('../config/logger');

const PORT = process.env.PORT || 4000;

const start = async () => {
  try {
    // 1. Initialiser la base de données (crée DB + tables + seed si nécessaire)
    await initializeDatabase();

    // 2. Vérifier la connexion
    await testConnection();

    // 3. Démarrer le serveur HTTP
    const server = app.listen(PORT, () => {
      logger.info(`[Server] NethaStock API démarrée sur le port ${PORT}`);
      logger.info(`[Server] Environnement : ${process.env.NODE_ENV || 'development'}`);
      logger.info(`[Server] Swagger : http://localhost:${PORT}/api-docs`);
    });

    // ── Graceful shutdown ──────────────────────────────────
    const shutdown = async (signal) => {
      logger.info(`[Server] Signal ${signal} reçu – arrêt propre...`);
      server.close(async () => {
        await close();
        logger.info('[Server] Serveur arrêté proprement');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

  } catch (err) {
    logger.error('[Server] Impossible de démarrer', { error: err.message });
    process.exit(1);
  }
};

start();
