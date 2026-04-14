// Description : Middlewares de validation des données avec express-validator
// Valide les entrées utilisateur et retourne des erreurs formatées

const { body, param, query, validationResult } = require('express-validator');
const logger = require('../config/logger');

// Middleware pour gérer les résultats de validation
const handleValidationErrors = (req, res, next) => {
  try {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      logger.warn('Erreurs de validation:', {
        url: req.url,
        method: req.method,
        errors: errors.array(),
        userId: req.user?.id
      });

      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg,
          value: error.value
        }))
      });
    }
    
    next();
  } catch (error) {
    logger.error('Erreur middleware validation:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erreur interne de validation'
    });
  }
};

// Validations pour l'authentification
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Email valide requis')
    .normalizeEmail()
    .trim(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Mot de passe minimum 8 caractères')
    .trim(),
  handleValidationErrors
];

const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Email valide requis')
    .normalizeEmail()
    .trim(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Mot de passe minimum 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Mot de passe doit contenir: minuscule, majuscule, chiffre, caractère spécial'),
  body('firstName')
    .isLength({ min: 2, max: 50 })
    .withMessage('Prénom entre 2 et 50 caractères')
    .trim(),
  body('lastName')
    .isLength({ min: 2, max: 50 })
    .withMessage('Nom entre 2 et 50 caractères')
    .trim(),
  body('role')
    .isIn(['magasinier', 'administrateur'])
    .withMessage('Rôle doit être magasinier ou administrateur'),
  handleValidationErrors
];

// Validations pour les produits
const validateProduct = [
  body('name')
    .isLength({ min: 2, max: 255 })
    .withMessage('Nom produit entre 2 et 255 caractères')
    .trim(),
  body('barcode')
    .isLength({ min: 1, max: 50 })
    .withMessage('Code-barres requis (max 50 caractères)')
    .trim(),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Prix doit être un nombre positif'),
  body('quantity')
    .isInt({ min: 0 })
    .withMessage('Quantité doit être un entier positif'),
  body('threshold')
    .isInt({ min: 0 })
    .withMessage('Seuil doit être un entier positif'),
  body('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID catégorie doit être un entier positif'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description maximum 1000 caractères')
    .trim(),
  handleValidationErrors
];

// Validations pour les catégories
const validateCategory = [
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nom catégorie entre 2 et 100 caractères')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description maximum 500 caractères')
    .trim(),
  handleValidationErrors
];

// Validations pour les mouvements de stock
const validateMovement = [
  body('productId')
    .isInt({ min: 1 })
    .withMessage('ID produit requis et valide'),
  body('type')
    .isIn(['entry', 'exit'])
    .withMessage('Type doit être entry ou exit'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantité doit être un entier positif'),
  body('motif')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Motif maximum 500 caractères')
    .trim(),
  handleValidationErrors
];

// Validations pour les paramètres d'URL
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID doit être un entier positif'),
  handleValidationErrors
];

// Validations pour les requêtes de recherche
const validateSearch = [
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Recherche entre 1 et 100 caractères')
    .trim(),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page doit être un entier positif'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite entre 1 et 100'),
  handleValidationErrors
];

// Validations pour les filtres de dates
const validateDateFilter = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Date de début doit être au format ISO8601'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Date de fin doit être au format ISO8601'),
  handleValidationErrors
];

// Validation pour mise à jour mot de passe
const validatePasswordUpdate = [
  body('currentPassword')
    .isLength({ min: 1 })
    .withMessage('Mot de passe actuel requis'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Nouveau mot de passe minimum 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Nouveau mot de passe doit contenir: minuscule, majuscule, chiffre, caractère spécial'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateLogin,
  validateRegister,
  validateProduct,
  validateCategory,
  validateMovement,
  validateId,
  validateSearch,
  validateDateFilter,
  validatePasswordUpdate
};