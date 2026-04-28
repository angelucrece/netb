const express    = require('express');
const router     = express.Router();
const controller = require('./StockMovementController');
const { authenticate, authorize } = require('../../middleware/auth');
const { validate } = require('../../middleware/validation');
const { entrySchema, exitSchema, transferSchema, rejectSchema } = require('./StockMovementValidation');

/**
 * @swagger
 * tags:
 *   name: Mouvements
 *   description: Réceptions, sorties, transferts, validations
 */

// Statiques AVANT /:id
router.get('/pending', authenticate, authorize('admin'), controller.getPending);

router.get('/',    authenticate, controller.getAll);
router.get('/:id', authenticate, controller.getById);

router.post('/in',
  authenticate,
  validate(entrySchema),
  controller.createEntry
);

router.post('/out',
  authenticate,
  validate(exitSchema),
  controller.createExit
);

router.post('/transfer',
  authenticate,
  authorize('admin','operator_stock','controller','site_manager'),
  validate(transferSchema),
  controller.createTransfer
);

router.patch('/:id/validate',
  authenticate, authorize('admin'),
  controller.validate
);

router.patch('/:id/reject',
  authenticate, authorize('admin'),
  validate(rejectSchema),
  controller.reject
);

module.exports = router;
