const express = require('express');

const controller = require('./PaymentController');
const { authenticate, authorize } = require('../../middleware/auth');
const { validate } = require('../../middleware/validation');
const { manualPaymentSchema, externalPaymentSchema } = require('./PaymentValidation');

const router = express.Router();

const PAYMENT_ACCESS = authorize('admin', 'cashier', 'accountant', 'commercial');

router.post('/invoices/:invoiceId/manual', authenticate, PAYMENT_ACCESS, validate(manualPaymentSchema), controller.registerManual);
router.post('/invoices/:invoiceId/external', authenticate, PAYMENT_ACCESS, validate(externalPaymentSchema), controller.initiateExternal);
router.get('/transactions/:id/status', authenticate, PAYMENT_ACCESS, controller.refreshExternalStatus);

module.exports = router;
