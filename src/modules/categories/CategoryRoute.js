const express    = require('express');
const router     = express.Router();
const controller = require('./CategoryController');
const { authenticate, authorize } = require('../../middleware/auth');
const { validate } = require('../../middleware/validation');
const { categorySchema } = require('./CategoryValidation');

/**
 * @swagger
 * tags:
 *   name: Catégories
 *   description: Familles de produits
 */

router.get('/',     authenticate, controller.getAll);
router.get('/:id',  authenticate, controller.getById);
router.post('/',    authenticate, authorize('admin'), validate(categorySchema), controller.create);
router.put('/:id',  authenticate, authorize('admin'), validate(categorySchema), controller.update);
router.delete('/:id', authenticate, authorize('admin'), controller.remove);

module.exports = router;
