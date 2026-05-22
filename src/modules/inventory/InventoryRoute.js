const express    = require('express');
const router     = express.Router();
const controller = require('./InventoryController');
const { authenticate, authorize } = require('../../middleware/auth');
const { validate } = require('../../middleware/validation');
const { startSessionSchema, itemSchema, updateItemSchema } = require('./InventoryValidation');

const INVENTORY_WORK = authorize('admin','operator_stock','controller','site_manager');
const INVENTORY_VALIDATE = authorize('admin','controller','site_manager');

/**
 * @swagger
 * tags:
 *   name: Inventaire
 *   description: Sessions, saisies, écarts, régularisation
 */

// Statique AVANT /:id
router.get('/sessions/active', authenticate, controller.getActiveSession);

router.get('/sessions',    authenticate, INVENTORY_WORK, controller.getSessions);
router.get('/sessions/:id', authenticate, INVENTORY_WORK, controller.getSessionById);

router.post('/sessions',
  authenticate, INVENTORY_WORK,
  validate(startSessionSchema),
  controller.startSession
);

router.post('/sessions/:id/items',
  authenticate, INVENTORY_WORK,
  validate(itemSchema),
  controller.addItem
);

router.put('/sessions/:id/items/:itemId',
  authenticate, INVENTORY_WORK,
  validate(updateItemSchema),
  controller.updateItem
);

router.get('/sessions/:id/gaps',      authenticate, INVENTORY_WORK, controller.getGaps);
router.post('/sessions/:id/validate', authenticate, INVENTORY_VALIDATE, controller.validateSession);
router.post('/sessions/:id/close',    authenticate, INVENTORY_VALIDATE, controller.closeSession);

module.exports = router;
