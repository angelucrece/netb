const express = require('express');
const router = express.Router();
const controller = require('./PurchaseController');
const { authenticate, authorize } = require('../../middleware/auth');
const { validate } = require('../../middleware/validation');
const { purchaseSchema, receiveSchema, cancelSchema } = require('./PurchaseValidation');

const MANAGE_PURCHASES = authorize('admin', 'buyer', 'operator_stock', 'site_manager');
const RECEIVE_PURCHASES = authorize('admin', 'buyer', 'operator_stock', 'controller', 'site_manager');

router.get('/', authenticate, controller.getAll);
router.get('/:id', authenticate, controller.getById);
router.post('/', authenticate, MANAGE_PURCHASES, validate(purchaseSchema), controller.create);
router.patch('/:id/order', authenticate, MANAGE_PURCHASES, controller.markOrdered);
router.post('/:id/receive', authenticate, RECEIVE_PURCHASES, validate(receiveSchema), controller.receive);
router.patch('/:id/cancel', authenticate, MANAGE_PURCHASES, validate(cancelSchema), controller.cancel);

module.exports = router;
