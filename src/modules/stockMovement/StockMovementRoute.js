// const express = require('express');
// const router = express.Router();

// const StockMovementController = require('./StockMovementController');
// const { authenticateToken } = require('../../middleware/auth');

// /**
//  * @swagger
//  * tags:
//  *   name: StockMovements
//  */

// /**
//  * @swagger
//  * /api/movements:
//  *   get:
//  *     summary: Liste des mouvements avec filtres
//  */
// router.get('/', authenticateToken, StockMovementController.getAll);

// /**
//  * @swagger
//  * /api/movements:
//  *   post:
//  *     summary: Créer un mouvement
//  */
// router.post('/', authenticateToken, StockMovementController.create);

// /**
//  * @swagger
//  * /api/movements/stats:
//  *   get:
//  *     summary: Statistiques des mouvements
//  */
// router.get('/stats', authenticateToken, StockMovementController.stats);

// module.exports = router;



const express = require('express');
const router = express.Router();

const StockMovementController = require('./StockMovementController');
const { authenticateToken } = require('../../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: StockMovements
 */

/**
 * @swagger
 * /api/movements:
 *   get:
 *     summary: Historique des mouvements
 */
router.get('/', authenticateToken, StockMovementController.getAll);

/**
 * @swagger
 * /api/movements/stats:
 *   get:
 *     summary: Statistiques des mouvements
 */
router.get('/stats', authenticateToken, StockMovementController.stats);

module.exports = router;