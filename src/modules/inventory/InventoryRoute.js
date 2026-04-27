const express    = require('express');
const router     = express.Router();
const controller = require('./InventoryController');
const { authenticate, authorize } = require('../../middleware/auth');
const { validate } = require('../../middleware/validation');
const { startSessionSchema, itemSchema, updateItemSchema } = require('./InventoryValidation');

const CTRL_ADMIN = authorize('admin','controller','site_manager');

/**
 * @swagger
 * tags:
 *   name: Inventaire
 *   description: Sessions, saisies, écarts, régularisation
 */

// Statique AVANT /:id
router.get('/sessions/active', authenticate, controller.getActiveSession);

router.get('/sessions',    authenticate, CTRL_ADMIN, controller.getSessions);
router.get('/sessions/:id', authenticate, CTRL_ADMIN, controller.getSessionById);

router.post('/sessions',
  authenticate, CTRL_ADMIN,
  validate(startSessionSchema),
  controller.startSession
);

router.post('/sessions/:id/items',
  authenticate,
  validate(itemSchema),
  controller.addItem
);

router.put('/sessions/:id/items/:itemId',
  authenticate,
  validate(updateItemSchema),
  controller.updateItem
);

router.get('/sessions/:id/gaps',      authenticate, CTRL_ADMIN, controller.getGaps);
router.post('/sessions/:id/validate', authenticate, CTRL_ADMIN, controller.validateSession);
router.post('/sessions/:id/close',    authenticate, CTRL_ADMIN, controller.closeSession);

module.exports = router;
