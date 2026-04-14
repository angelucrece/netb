const { body } = require('express-validator');
const { handleValidationErrors } = require('../../middleware/validation');

const validateInventory = [
  body('productId').isInt(),
  body('siteId').isInt(),
  body('realQuantity').isInt({ min: 0 }),

  handleValidationErrors
];

module.exports = { validateInventory };