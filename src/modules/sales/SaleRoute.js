const express = require('express');
const router = express.Router();
const controller = require('./SaleController');
const { authenticate, authorize } = require('../../middleware/auth');
const { validate } = require('../../middleware/validation');
const { saleSchema, deliverySchema, paymentSchema, cancelSchema } = require('./SaleValidation');

const SALES_ACCESS = authorize('admin', 'commercial', 'site_manager', 'cashier', 'operator_stock');
const DELIVERY_ACCESS = authorize('admin', 'commercial', 'site_manager', 'delivery_agent', 'operator_stock');
const CASH_ACCESS = authorize('admin', 'cashier', 'accountant');

router.get('/deliveries', authenticate, DELIVERY_ACCESS, controller.getDeliveries);
router.get('/deliveries/:id', authenticate, DELIVERY_ACCESS, controller.getDeliveryById);
router.patch('/deliveries/:id/start', authenticate, DELIVERY_ACCESS, controller.startDelivery);
router.patch('/deliveries/:id/delivered', authenticate, DELIVERY_ACCESS, controller.validateDelivery);

router.get('/invoices', authenticate, authorize('admin', 'commercial', 'accountant', 'cashier'), controller.getInvoices);
router.get('/invoices/:id', authenticate, authorize('admin', 'commercial', 'accountant', 'cashier'), controller.getInvoiceById);
router.post('/invoices/:id/payments', authenticate, CASH_ACCESS, validate(paymentSchema), controller.registerPayment);

router.get('/', authenticate, SALES_ACCESS, controller.getAll);
router.get('/:id', authenticate, SALES_ACCESS, controller.getById);
router.post('/', authenticate, SALES_ACCESS, validate(saleSchema), controller.create);
router.post('/:id/confirm', authenticate, SALES_ACCESS, controller.confirm);
router.post('/:id/delivery', authenticate, DELIVERY_ACCESS, validate(deliverySchema), controller.createDelivery);
router.post('/:id/invoice', authenticate, authorize('admin', 'commercial', 'accountant'), controller.issueInvoice);
router.patch('/:id/cancel', authenticate, SALES_ACCESS, validate(cancelSchema), controller.cancel);

module.exports = router;
