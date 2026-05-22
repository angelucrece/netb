const express    = require('express');
const router     = express.Router();
const controller = require('./StockMovementController');
const { authenticate, authorize } = require('../../middleware/auth');
const { validate } = require('../../middleware/validation');
const { entrySchema, exitSchema, transferSchema, rejectSchema } = require('./StockMovementValidation');

const STOCK_WORK = authorize('admin','operator_stock','controller','site_manager');
const STOCK_VALIDATE = authorize('admin','operator_stock','controller','site_manager');

/**
 * @swagger
 * tags:
 *   name: Mouvements
 *   description: Réceptions, sorties, transferts, validations
 */

// Statiques AVANT /:id
router.get('/pending', authenticate, STOCK_VALIDATE, controller.getPending);

router.get('/',    authenticate, controller.getAll);
router.get('/:id', authenticate, controller.getById);

router.post('/in',
  authenticate, STOCK_WORK,
  validate(entrySchema),
  controller.createEntry
);

router.post('/out',
  authenticate, STOCK_WORK,
  validate(exitSchema),
  controller.createExit
);

router.post('/transfer',
  authenticate, STOCK_WORK,
  validate(transferSchema),
  controller.createTransfer
);

router.patch('/:id/validate',
  authenticate, STOCK_VALIDATE,
  controller.validate
);

router.patch('/:id/reject',
  authenticate, STOCK_VALIDATE,
  validate(rejectSchema),
  controller.reject
);

module.exports = router;
