// Description : Configuration du système de logging avec Winston
// Gère les logs application, erreurs et debug

const winston = require('winston');
const path = require('node:path');

// Configuration des niveaux de log personnalisés
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Couleurs pour les niveaux de log
const logColors = {
  error: 'red',
  warn: 'yellow', 
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(logColors);

// Format personnalisé pour les logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;

    const safeTimestamp =
      typeof timestamp === 'string'
        ? timestamp
        : JSON.stringify(timestamp);

    const safeMessage =
      typeof message === 'string'
        ? message
        : JSON.stringify(message);

    const metaString =
      Object.keys(meta).length > 0
        ? `\n${JSON.stringify(meta, null, 2)}`
        : '';

    return `${safeTimestamp} [${level}]: ${safeMessage}${metaString}`;
  })
);

// Format pour les fichiers (sans couleurs)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Création du logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  format: fileFormat,
  defaultMeta: { service: 'nethastock-api' },
  transports: [
    // Erreurs dans fichier séparé
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Tous les logs dans fichier combiné
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// En développement, ajouter logs console
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: logFormat,
    })
  );
}

// Création du dossier logs s'il n'existe pas
const fs = require('node:fs');
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

module.exports = logger;