const express    = require('express');
const router     = express.Router();
const controller = require('./AuditLogController');
const { authenticate, authorize } = require('../../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Audit Logs
 *   description: Journal complet des actions (admin uniquement)
 */

/**
 * @swagger
 * /api/v1/audit-logs:
 *   get:
 *     summary: Liste paginée des logs d'audit
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema: { type: integer }
 *       - in: query
 *         name: action
 *         schema: { type: string }
 *         description: Recherche partielle (ex. PRODUCT, MOVEMENT)
 *       - in: query
 *         name: entity_type
 *         schema: { type: string }
 *         description: product | movement | user | inventory | category | site
 *       - in: query
 *         name: date_from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: date_to
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200: { description: Liste des logs }
 *       403: { description: Accès refusé }
 */
router.get('/', authenticate, authorize('admin'), controller.getAll);

/**
 * @swagger
 * /api/v1/audit-logs/summary:
 *   get:
 *     summary: Résumé des actions par type (compteurs)
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date_from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: date_to
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: Résumé des actions }
 */
router.get('/summary', authenticate, authorize('admin'), controller.getSummary);

/**
 * @swagger
 * /api/v1/audit-logs/{id}:
 *   get:
 *     summary: Détail d'un log (avec old_value / new_value)
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Détail du log }
 *       404: { description: Log introuvable }
 */
router.get('/:id', authenticate, authorize('admin'), controller.getById);

module.exports = router;
