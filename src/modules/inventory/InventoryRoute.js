const express = require('express');
const router = express.Router();

const InventoryController = require('./InventoryController');
const { authenticateToken } = require('../../middleware/auth');
const { validateInventory } = require('./InventoryValidation');

/**
 * @swagger
 * tags:
 *   name: Inventories
 */

/**
 * @swagger
 * /api/inventories:
 *   post:
 *     summary: Effectuer un inventaire
 */
router.post('/', authenticateToken, validateInventory, InventoryController.create);

/**
 * @swagger
 * /api/inventories:
 *   get:
 *     summary: Liste des inventaires
 */
router.get('/', authenticateToken, InventoryController.getAll);

module.exports = router;