const express    = require('express');
const router     = express.Router();
const controller = require('./StockDocumentController');
const { authenticate, authorize } = require('../../middleware/auth');
const { validate } = require('../../middleware/validation');
const { documentSchema } = require('./StockDocumentValidation');

/**
 * @swagger
 * tags:
 *   name: Documents
 *   description: Bons de réception, sortie, transfert
 */

router.get('/',    authenticate, controller.getAll);
router.get('/:id', authenticate, controller.getById);

router.post('/',
  authenticate,
  validate(documentSchema),
  controller.create
);

router.post('/:id/validate',
  authenticate, authorize('admin','controller'),
  controller.validate
);

module.exports = router;
