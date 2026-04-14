// StockRoute.js
const express = require('express');
const router = express.Router();
const StockController = require('./StockController');
const { authenticateToken } = require('../../middleware/auth');
const { validateStockTransfer ,validateStock } = require('./StockValidation');

/**
 * @swagger
 * tags:
 *   name: Stock
 *   description: Gestion des stocks par site
 */

/**
 * @swagger
 * /api/stocks:
 *   get:
 *     summary: Liste des stocks (filtrage par site et produit possible)
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: siteId
 *         schema:
 *           type: integer
 *         description: Filtrer par site
 *       - in: query
 *         name: productId
 *         schema:
 *           type: integer
 *         description: Filtrer par produit
 */
router.get('/', authenticateToken, StockController.getStocks);

/**
 * @swagger
 * /api/stocks/add:
 *   post:
 *     summary: Ajouter du stock
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 */
router.post('/add', authenticateToken, validateStock, StockController.addStock);

/**
 * @swagger
 * /api/stocks/remove:
 *   post:
 *     summary: Retirer du stock
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 */
router.post('/remove', authenticateToken, validateStock, StockController.removeStock);

/**
 * @swagger
 * /api/stocks/update:
 *   post:
 *     summary: Mettre à jour la quantité de stock
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 */
router.post('/update', authenticateToken, validateStock, StockController.updateStock);

/**
 * @swagger
 * /api/stocks/transfer:
 *   post:
 *     summary: Transférer du stock entre sites
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 */
router.post('/transfer', authenticateToken, validateStockTransfer, StockController.transfer);

module.exports = router;