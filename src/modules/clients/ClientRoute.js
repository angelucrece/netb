const express = require('express');
const router = express.Router();
const controller = require('./ClientController');
const { authenticate, authorize } = require('../../middleware/auth');
const { validate } = require('../../middleware/validation');
const { clientSchema, toggleSchema } = require('./ClientValidation');

const MANAGE_CLIENTS = authorize('admin', 'commercial', 'site_manager', 'cashier');

router.get('/', authenticate, controller.getAll);
router.get('/:id', authenticate, controller.getById);
router.post('/', authenticate, MANAGE_CLIENTS, validate(clientSchema), controller.create);
router.put('/:id', authenticate, MANAGE_CLIENTS, validate(clientSchema), controller.update);
router.patch('/:id/toggle', authenticate, MANAGE_CLIENTS, validate(toggleSchema), controller.toggle);
router.delete('/:id', authenticate, authorize('admin'), controller.remove);

module.exports = router;
