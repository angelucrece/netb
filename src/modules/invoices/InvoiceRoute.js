const express = require('express');

const controller = require('./InvoiceController');
const { authenticate, authorize } = require('../../middleware/auth');

const router = express.Router();

const INVOICE_ACCESS = authorize('admin', 'commercial', 'accountant', 'cashier');
const INVOICE_CREATE = authorize('admin', 'commercial', 'accountant');

router.get('/', authenticate, INVOICE_ACCESS, controller.getAll);
router.get('/:id', authenticate, INVOICE_ACCESS, controller.getById);
router.post('/sales/:saleId', authenticate, INVOICE_CREATE, controller.issue);

module.exports = router;
