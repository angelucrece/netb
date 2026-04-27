const ApiError = require('../utils/ApiError');

/**
 * Middleware de validation Joi générique.
 * Usage : validate(myJoiSchema)
 * Le schéma peut valider body, params et/ou query.
 */
const validate = (schema) => (req, res, next) => {
  const toValidate = {};
  if (schema.describe().keys?.body)   toValidate.body   = req.body;
  if (schema.describe().keys?.params) toValidate.params = req.params;
  if (schema.describe().keys?.query)  toValidate.query  = req.query;

  // Si le schéma ne déclare pas de clés body/params/query, on valide directement le body
  const target = Object.keys(toValidate).length ? toValidate : req.body;

  const { error, value } = schema.validate(target, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const details = error.details.map((d) => d.message);
    throw ApiError.unprocessable('Données invalides', details);
  }

  // Réinjecter les valeurs nettoyées
  if (value.body)   req.body   = value.body;
  if (value.params) req.params = value.params;
  if (value.query)  req.query  = value.query;
  if (!value.body && !value.params && !value.query) req.body = value;

  next();
};

// ── Validations express-validator (compatibilité ancien code) ──
const { body, param, query, validationResult } = require('express-validator');
const logger = require('../config/logger');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Erreurs de validation', { url: req.url, errors: errors.array() });
    return res.status(422).json({
      success: false,
      message: 'Données invalides',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const validateLogin = [
  body('email').isEmail().withMessage('Email valide requis').normalizeEmail().trim(),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe minimum 6 caractères').trim(),
  handleValidationErrors,
];

const validateRegister = [
  body('email').isEmail().withMessage('Email valide requis').normalizeEmail().trim(),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe minimum 6 caractères').trim(),
  body('firstName').isLength({ min: 2, max: 50 }).withMessage('Prénom entre 2 et 50 caractères').trim(),
  body('lastName').isLength({ min: 2, max: 50 }).withMessage('Nom entre 2 et 50 caractères').trim(),
  handleValidationErrors,
];

module.exports = {
  validate,
  handleValidationErrors,
  validateLogin,
  validateRegister,
};
