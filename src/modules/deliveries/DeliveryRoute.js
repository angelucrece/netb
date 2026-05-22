const express = require('express');

const controller = require('./DeliveryController');
const { authenticate, authorize } = require('../../middleware/auth');

const router = express.Router();

const DELIVERY_ACCESS = authorize('admin', 'commercial', 'site_manager', 'delivery_agent', 'operator_stock');

router.get('/', authenticate, DELIVERY_ACCESS, controller.getAll);
router.get('/:id', authenticate, DELIVERY_ACCESS, controller.getById);
router.post('/sales/:saleId', authenticate, DELIVERY_ACCESS, controller.create);
router.patch('/:id/start', authenticate, DELIVERY_ACCESS, controller.start);
router.patch('/:id/delivered', authenticate, DELIVERY_ACCESS, controller.validate);

module.exports = router;
