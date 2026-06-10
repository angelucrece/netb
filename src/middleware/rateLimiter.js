// Description : Middleware de limitation du taux de requêtes
// Compatible express-rate-limit v7

const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');
const { ipKeyGenerator } = require('express-rate-limit');

// Rate limiter général
const generalLimiter = rateLimit({
  windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number.parseInt(process.env.RATE_LIMIT_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  // keyGenerator: (req) => req.ip || req.connection.remoteAddress,
  keyGenerator: (req) => ipKeyGenerator(req),
  skip: (req) => req.url === '/api/health',

  handler: (req, res, next, options) => {
    logger.warn('Rate limit atteint', {
      ip: req.ip,
      url: req.url,
      userAgent: req.get('User-Agent')
    });

    return res.status(options.statusCode).json({
      success: false,
      message: 'Trop de requêtes, veuillez réessayer plus tard',
      retryAfter: Math.ceil((options.windowMs || 900000) / 1000)
    });
  }
});

// Rate limiter strict pour l’authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,

  handler: (req, res, next, options) => {
    logger.error('Tentatives de connexion suspectes', {
      ip: req.ip,
      url: req.url,
      body: req.body ? { email: req.body.email } : null,
      userAgent: req.get('User-Agent')
    });

    return res.status(options.statusCode).json({
      success: false,
      message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
      retryAfter: 900
    });
  }
});

// Rate limiter pour les opérations critiques
const criticalOpsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    return res.status(options.statusCode).json({
      success: false,
      message: 'Trop d\'opérations critiques. Patientez une minute.',
      retryAfter: 60
    });
  }
});

// Rate limiter pour les rapports
const reportsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    return res.status(options.statusCode).json({
      success: false,
      message: 'Limite de génération de rapports atteinte. Réessayez dans 5 minutes.',
      retryAfter: 300
    });
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  criticalOpsLimiter,
  reportsLimiter
};