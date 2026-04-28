const express    = require('express');
const router     = express.Router();
const controller = require('./SiteController');
const { authenticate, authorize } = require('../../middleware/auth');
const { validate } = require('../../middleware/validation');
const { siteSchema, toggleSchema } = require('./SiteValidation');

/**
 * @swagger
 * tags:
 *   name: Sites
 *   description: Gestion des sites / magasins / entrepôts
 */

// GET /api/v1/sites  – public (dropdown login)
router.get('/', controller.getAll);

// GET /api/v1/sites/:id
router.get('/:id', authenticate, controller.getById);

// POST /api/v1/sites
router.post('/', authenticate, authorize('admin'), validate(siteSchema), controller.create);

// PUT /api/v1/sites/:id
router.put('/:id', authenticate, authorize('admin'), validate(siteSchema), controller.update);

// PATCH /api/v1/sites/:id/toggle
router.patch('/:id/toggle', authenticate, authorize('admin'), validate(toggleSchema), controller.toggle);

// DELETE /api/v1/sites/:id
router.delete('/:id', authenticate, authorize('admin'), controller.remove);

module.exports = router;
