const express    = require('express');
const router     = express.Router();
const controller = require('./ProductController');
const { authenticate, authorize } = require('../../middleware/auth');
const { validate } = require('../../middleware/validation');
const { productSchema, variantsSchema } = require('./ProductValidation');
const { upload } = require('../../config/upload');

/**
 * @swagger
 * tags:
 *   name: Produits
 *   description: Catalogue produits, QR codes, variantes
 */

// Routes statiques AVANT /:id
router.get('/alerts',        authenticate, controller.getAlerts);
router.get('/scan/:barcode', authenticate, controller.scan);

router.get('/',    authenticate, controller.getAll);
router.get('/:id', authenticate, controller.getById);
router.get('/:id/qrcode', authenticate, controller.getQrCode);

router.post('/',
  authenticate, authorize('admin'),
  upload.single('photo'),
  validate(productSchema),
  controller.create
);

router.put('/:id',
  authenticate, authorize('admin'),
  validate(productSchema),
  controller.update
);

router.patch('/:id/photo',
  authenticate, authorize('admin'),
  upload.single('photo'),
  controller.updatePhoto
);

router.put('/:id/variants',
  authenticate, authorize('admin'),
  validate(variantsSchema),
  controller.updateVariants
);

router.delete('/:id', authenticate, authorize('admin'), controller.remove);

module.exports = router;
