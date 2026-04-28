const express    = require('express');
const router     = express.Router();
const controller = require('./RoleController');
const { authenticate, authorize } = require('../../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Rôles
 *   description: Référentiel des rôles (lecture seule)
 */

/**
 * @swagger
 * /api/v1/roles:
 *   get:
 *     summary: Liste des 7 rôles
 *     tags: [Rôles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Liste des rôles }
 */
router.get('/', authenticate, controller.getAll);

/**
 * @swagger
 * /api/v1/roles/{id}:
 *   get:
 *     summary: Détail d'un rôle
 *     tags: [Rôles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Rôle trouvé }
 *       404: { description: Rôle introuvable }
 */
router.get('/:id', authenticate, authorize('admin'), controller.getById);

module.exports = router;
