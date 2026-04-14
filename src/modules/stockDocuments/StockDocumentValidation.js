const { body } = require('express-validator');
const { handleValidationErrors } = require('../../middleware/validation');

const validateDocument = [
  body('type').isIn(['RECEPTION', 'SORTIE', 'TRANSFERT']),
  body('siteId').isInt(),
  body('destinationSiteId').optional().isInt(),
  body('items').isArray({ min: 1 }),
  body('items.*.productId').isInt(),
  body('items.*.quantity').isInt({ min: 1 }),

  handleValidationErrors
];

module.exports = { validateDocument };