
// // Description : Validation des produits avec Joi

// const Joi = require('joi');
// const logger = require('../../config/logger');

// // 🔹 Validation création / modification produit
// const validateProduct = (req, res, next) => {
//   const schema = Joi.object({
//     name: Joi.string().min(2).max(150).required(),
//     barcode: Joi.string().min(3).max(50).required(),
//     price: Joi.number().positive().required(),
//     quantity: Joi.number().integer().min(0).required(),
//     threshold: Joi.number().integer().min(0).required(),
//     category_id: Joi.number().integer().allow(null),
//     description: Joi.string().allow('', null).max(255)
//   });

//   const { error } = schema.validate(req.body);

//   if (error) {
//     logger.warn('Validation produit échouée', {
//       error: error.details[0].message,
//       body: req.body,
//       userId: req.user?.id
//     });

//     return res.status(400).json({
//       success: false,
//       message: error.details[0].message
//     });
//   }

//   next();
// };

// // 🔹 Validation ID (paramètres URL)
// const validateId = (req, res, next) => {
//   const id = parseInt(req.params.id);

//   if (isNaN(id) || id <= 0) {
//     logger.warn('ID invalide', {
//       id: req.params.id,
//       userId: req.user?.id
//     });

//     return res.status(400).json({
//       success: false,
//       message: 'ID invalide'
//     });
//   }

//   next();
// };

// // 🔹 Validation recherche / pagination
// const validateSearch = (req, res, next) => {
//   const schema = Joi.object({
//     search: Joi.string().allow(''),
//     page: Joi.number().integer().min(1),
//     limit: Joi.number().integer().min(1).max(100),
//     categoryId: Joi.number().integer(),
//     lowStock: Joi.string().valid('true', 'false')
//   });

//   const { error } = schema.validate(req.query);

//   if (error) {
//     logger.warn('Validation recherche produits échouée', {
//       error: error.details[0].message,
//       query: req.query,
//       userId: req.user?.id
//     });

//     return res.status(400).json({
//       success: false,
//       message: error.details[0].message
//     });
//   }

//   next();
// };

// module.exports = {
//   validateProduct,
//   validateId,
//   validateSearch
// };


// Description : Validation des produits avec Joi

const Joi = require('joi');
const logger = require('../../config/logger');

// 🔹 Validation création / modification produit
const validateProduct = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(150).required(),
    barcode: Joi.string().min(3).max(50).required(),
    selling_price: Joi.number().positive().required(),
    purchase_price: Joi.number().positive().required(),
    threshold: Joi.number().integer().min(0).required(),
    category_id: Joi.number().integer().allow(null),
    description: Joi.string().allow('', null).max(500),
    photo: Joi.string().allow('', null).max(255).optional()
  });

  const { error } = schema.validate(req.body);

  if (error) {
    logger.warn('Validation produit échouée', {
      error: error.details[0].message,
      body: req.body,
      userId: req.user?.id
    });

    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }

  // 🔥 Vérification supplémentaire : prix de vente >= prix d'achat
  if (req.body.selling_price < req.body.purchase_price) {
    logger.warn('Prix de vente inférieur au prix d\'achat', {
      selling_price: req.body.selling_price,
      purchase_price: req.body.purchase_price,
      userId: req.user?.id
    });

    return res.status(400).json({
      success: false,
      message: 'Le prix de vente doit être supérieur ou égal au prix d\'achat'
    });
  }

  next();
};

// 🔹 Validation ID (paramètres URL)
const validateId = (req, res, next) => {
  const id = parseInt(req.params.id);

  if (isNaN(id) || id <= 0) {
    logger.warn('ID invalide', {
      id: req.params.id,
      userId: req.user?.id
    });

    return res.status(400).json({
      success: false,
      message: 'ID invalide'
    });
  }

  next();
};

// 🔹 Validation recherche / pagination (améliorée)
const validateSearch = (req, res, next) => {
  const schema = Joi.object({
    search: Joi.string().allow('').optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    category_id: Joi.number().integer().optional(),
    site_id: Joi.number().integer().optional(),
    lowStock: Joi.string().valid('true', 'false').optional(),
    minSellingPrice: Joi.number().positive().optional(),
    maxSellingPrice: Joi.number().positive().optional(),
    minPurchasePrice: Joi.number().positive().optional(),
    maxPurchasePrice: Joi.number().positive().optional(),
    minMargin: Joi.number().min(0).max(100).optional(),
    maxMargin: Joi.number().min(0).max(100).optional(),
    hasPhoto: Joi.string().valid('true', 'false').optional(),
   // minQuantity: Joi.number().integer().min(0).optional(),
    sort: Joi.string().optional(),
    sortBy: Joi.string().valid('name', 'selling_price', 'purchase_price', 'threshold', 'created_at', 'barcode').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc')
  });

  const { error, value } = schema.validate(req.query);

  if (error) {
    logger.warn('Validation recherche produits échouée', {
      error: error.details[0].message,
      query: req.query,
      userId: req.user?.id
    });

    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }

  // Remplacer les valeurs par défaut
  req.query = value;
  next();
};

module.exports = {
  validateProduct,
  validateId,
  validateSearch
};