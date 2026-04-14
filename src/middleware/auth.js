// Description : Middleware d'authentification JWT
// Vérifie les tokens et gère l'accès basé sur les rôles

const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

// Middleware pour vérifier l'authentification JWT
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
      logger.warn('Tentative accès sans token', { 
        ip: req.ip, 
        url: req.url 
      });
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification requis'
      });
    }

    // Vérification et décodage du token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        logger.warn('Token invalide:', { 
          error: err.message, 
          ip: req.ip 
        });
        
        // Gestion des différents types d'erreurs JWT
        let message = 'Token invalide';
        if (err.name === 'TokenExpiredError') {
          message = 'Token expiré, veuillez vous reconnecter';
        } else if (err.name === 'JsonWebTokenError') {
          message = 'Token malformé';
        }
        
        return res.status(403).json({
          success: false,
          message
        });
      }

      // Ajout des informations utilisateur à la requête
      req.user = user;
      logger.debug('Authentification réussie', { 
        userId: user.id, 
        email: user.email 
      });
      next();
    });
  } catch (error) {
    logger.error('Erreur middleware authentification:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erreur interne d\'authentification'
    });
  }
};

// Middleware pour vérifier le rôle administrateur
const requireAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      logger.error('requireAdmin appelé sans authentification préalable');
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    if (req.user.role !== 'administrateur') {
      logger.warn('Accès admin refusé:', { 
        userId: req.user.id, 
        role: req.user.role,
        url: req.url
      });
      return res.status(403).json({
        success: false,
        message: 'Accès administrateur requis'
      });
    }

    logger.debug('Accès admin autorisé', { userId: req.user.id });
    next();
  } catch (error) {
    logger.error('Erreur middleware requireAdmin:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erreur vérification privilèges'
    });
  }
};

// Middleware pour vérifier les rôles autorisés (flexible)
const requireRoles = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentification requise'
        });
      }

      if (!roles.includes(req.user.role)) {
        logger.warn('Accès refusé - rôle insuffisant:', { 
          userId: req.user.id, 
          userRole: req.user.role,
          requiredRoles: roles,
          url: req.url
        });
        return res.status(403).json({
          success: false,
          message: `Accès refusé. Rôles requis: ${roles.join(', ')}`
        });
      }

      logger.debug('Accès autorisé', { 
        userId: req.user.id, 
        role: req.user.role 
      });
      next();
    } catch (error) {
      logger.error('Erreur middleware requireRoles:', error.message);
      res.status(500).json({
        success: false,
        message: 'Erreur vérification rôles'
      });
    }
  };
};

// Middleware optionnel pour extraire l'utilisateur si token présent
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(); // Pas de token, continuer sans authentification
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
        logger.debug('Authentification optionnelle réussie', { userId: user.id });
      }
      next(); // Continuer même si token invalide
    });
  } catch (error) {
    logger.error('Erreur middleware optionalAuth:', error.message);
    next(); // Continuer malgré l'erreur
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireRoles,
  optionalAuth
};