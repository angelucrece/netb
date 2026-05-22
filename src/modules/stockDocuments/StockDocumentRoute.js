const express    = require('express');
const router     = express.Router();
const controller = require('./StockDocumentController');
const { authenticate, authorize } = require('../../middleware/auth');
const { validate } = require('../../middleware/validation');
const { documentSchema } = require('./StockDocumentValidation');
const DOCUMENT_WORK = authorize('admin','operator_stock','site_manager');
const DOCUMENT_VALIDATE = authorize('admin','controller','site_manager');

/**
 * @swagger
 * tags:
 *   name: Documents
 *   description: Bons de réception, sortie, transfert
 */

router.get('/',    authenticate, controller.getAll);
router.get('/:id', authenticate, controller.getById);

router.post('/',
  authenticate, DOCUMENT_WORK,
  validate(documentSchema),
  controller.create
);

router.post('/:id/validate',
  authenticate, DOCUMENT_VALIDATE,
  controller.validate
);

module.exports = router;
