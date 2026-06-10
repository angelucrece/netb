const jwt = require('jsonwebtoken');
const db = require('../config/database');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../config/logger');

/**
 * Vérifie le JWT, charge l'utilisateur depuis la DB, vérifie qu'il est actif.
 * Injecte req.user = { id, email, role: { id, name }, site_id }
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) throw ApiError.unauthorized('Token d\'authentification requis');

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    const msg = err.name === 'TokenExpiredError'
      ? 'Token expiré, veuillez vous reconnecter'
      : 'Token invalide';
    throw ApiError.unauthorized(msg);
  }

  const result = await db.query(
    `SELECT u.id, u.email, u.active, u.site_id,
            r.id as role_id, r.name as role_name
     FROM users u
     LEFT JOIN roles r ON u.role_id = r.id
     WHERE u.id = $1`,
    [decoded.id]
  );

  const user = result.rows[0];
  if (!user?.active) {
  throw ApiError.unauthorized('Compte inactif ou introuvable');
}
  req.user = {
    id:      user.id,
    email:   user.email,
    site_id: user.site_id,
    role: {
      id:   user.role_id,
      name: user.role_name,
    },
  };

  logger.debug('[Auth] Authentifié', { userId: user.id, role: user.role_name });
  next();
});

/**
 * Contrôle d'accès par rôle (RBAC).
 * Usage : authorize('admin', 'controller')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) throw ApiError.unauthorized();

  if (!roles.includes(req.user?.role?.name)) {
    logger.warn('[Auth] Accès refusé', {
      userId: req.user.id,
      userRole: req.user?.role?.name,
      required: roles,
      url: req.originalUrl,
    });
    throw ApiError.forbidden(
  `Rôle requis : ${roles.join(' ou ')}`
); // eslint-disable-line security/detect-object-injection -- roles provient des arguments de la fonction authorize()
  }
  next();
};

// Alias pour compatibilité avec l'ancien code
const authenticateToken = authenticate;
const requireRoles = (...roles) => authorize(...roles);
const requireAdmin = authorize('admin');

module.exports = { authenticate, authorize, authenticateToken, requireRoles, requireAdmin };