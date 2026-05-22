const express    = require('express');
const router     = express.Router();
const controller = require('./CategoryController');
const { authenticate, authorize } = require('../../middleware/auth');
const { validate } = require('../../middleware/validation');
const { categorySchema } = require('./CategoryValidation');
const MANAGE_CATALOG = authorize('admin','operator_stock','site_manager');

/**
 * @swagger
 * tags:
 *   name: Catégories
 *   description: Familles de produits
 */

router.get('/',     authenticate, controller.getAll);
router.get('/:id',  authenticate, controller.getById);
router.post('/',    authenticate, MANAGE_CATALOG, validate(categorySchema), controller.create);
router.put('/:id',  authenticate, MANAGE_CATALOG, validate(categorySchema), controller.update);
router.delete('/:id', authenticate, authorize('admin'), controller.remove);

module.exports = router;
