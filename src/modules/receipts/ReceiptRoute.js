const express = require('express');

const controller = require('./ReceiptController');
const { authenticate, authorize } = require('../../middleware/auth');

const router = express.Router();

const RECEIPT_ACCESS = authorize('admin', 'cashier', 'accountant', 'commercial');

router.get('/', authenticate, RECEIPT_ACCESS, controller.getAll);
router.get('/payments/:paymentId', authenticate, RECEIPT_ACCESS, controller.getByPaymentId);
router.get('/:id/pdf', authenticate, RECEIPT_ACCESS, controller.exportPdf);
router.get('/:id', authenticate, RECEIPT_ACCESS, controller.getById);

module.exports = router;
