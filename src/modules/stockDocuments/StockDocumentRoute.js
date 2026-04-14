const express = require('express');
const router = express.Router();

const StockDocumentController = require('./StockDocumentController');
const { authenticateToken } = require('../../middleware/auth');
const { validateDocument } = require('./StockDocumentValidation');

/**
 * @swagger
 * tags:
 *   name: StockDocuments
 */

/**
 * @swagger
 * /api/documents:
 *   post:
 *     summary: Créer un bordereau
 */
router.post('/', authenticateToken, validateDocument, StockDocumentController.create);

/**
 * @swagger
 * /api/documents/{id}/validate:
 *   post:
 *     summary: Valider un bordereau
 */
router.post('/:id/validate', authenticateToken, StockDocumentController.validate);

module.exports = router;