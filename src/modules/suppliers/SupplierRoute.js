const express = require('express');
const router = express.Router();
const controller = require('./SupplierController');
const { authenticate, authorize } = require('../../middleware/auth');
const { validate } = require('../../middleware/validation');
const { supplierSchema, toggleSchema } = require('./SupplierValidation');

const MANAGE_SUPPLIERS = authorize('admin', 'buyer', 'site_manager');

router.get('/', authenticate, controller.getAll);
router.get('/:id', authenticate, controller.getById);
router.post('/', authenticate, MANAGE_SUPPLIERS, validate(supplierSchema), controller.create);
router.put('/:id', authenticate, MANAGE_SUPPLIERS, validate(supplierSchema), controller.update);
router.patch('/:id/toggle', authenticate, MANAGE_SUPPLIERS, validate(toggleSchema), controller.toggle);
router.delete('/:id', authenticate, authorize('admin'), controller.remove);

module.exports = router;
