const express = require('express');
const router = express.Router();
const controller = require('./CashController');
const { authenticate, authorize } = require('../../middleware/auth');
const { validate } = require('../../middleware/validation');
const { openSchema, closeSchema } = require('./CashValidation');

const CASH_ACCESS = authorize('admin', 'cashier', 'accountant');
const CASHIER_ACCESS = authorize('admin', 'cashier');

router.get('/payments', authenticate, CASH_ACCESS, controller.getPayments);
router.get('/sessions/current', authenticate, CASHIER_ACCESS, controller.getCurrent);
router.get('/sessions', authenticate, CASH_ACCESS, controller.getSessions);
router.get('/sessions/:id', authenticate, CASH_ACCESS, controller.getById);
router.post('/sessions/open', authenticate, CASHIER_ACCESS, validate(openSchema), controller.open);
router.post('/sessions/:id/close', authenticate, CASHIER_ACCESS, validate(closeSchema), controller.close);

module.exports = router;
