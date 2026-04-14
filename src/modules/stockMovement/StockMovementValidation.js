const { body } = require('express-validator');
const { handleValidationErrors } = require('../../middleware/validation');

const validateMovement = [
  body('productId').isInt().withMessage('productId requis'),
  body('siteId').isInt().withMessage('siteId requis'),
  body('type').isIn(['entry', 'exit']),
  body('quantity').isInt({ min: 1 }),
  handleValidationErrors
];

module.exports = { validateMovement };