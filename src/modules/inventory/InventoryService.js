const InventoryRepository = require('./InventoryRepository');
const StockService = require('../stocks/StockService');
//const StockMovementService = require('../stockMovements/StockMovementService');
const  StockMovementService = require('../stockMovement/StockMovementService');
const db = require('../../config/database');
const logger = require('../../config/logger');

class InventoryService {

  static async createInventory({ productId, siteId, realQuantity, userId }) {

    return db.transaction(async (client) => {

      try {
        logger.info('Début inventaire', { productId, siteId });

        // 1. récupérer stock actuel
        const stockResult = await client.query(
          `SELECT quantity FROM stocks WHERE product_id=$1 AND site_id=$2`,
          [productId, siteId]
        );

        if (!stockResult.rows.length) {
          throw new Error('Stock introuvable');
        }

        const systemQuantity = stockResult.rows[0].quantity;

        // 2. calcul différence
        const difference = realQuantity - systemQuantity;

        // 3. update stock
        await client.query(
          `UPDATE stocks SET quantity = $1 WHERE product_id=$2 AND site_id=$3`,
          [realQuantity, productId, siteId]
        );

        // 4. créer mouvement adjustment
        if (difference !== 0) {
          await StockMovementService.createMovement({
            productId,
            siteId,
            quantity: Math.abs(difference),
            type: 'adjustment',
            userId,
            reason: 'Inventaire'
          });
        }

        // 5. enregistrer inventaire
        const inventory = await InventoryRepository.create({
          productId,
          siteId,
          systemQuantity,
          realQuantity,
          difference,
          userId
        });

        logger.info('Inventaire effectué', { difference });

        return inventory;

      } catch (error) {
        logger.error('Erreur inventaire', { error: error.message });
        throw error;
      }
    });
  }

  static async getInventories(query) {
    return await InventoryRepository.findAll(query);
  }
}

module.exports = InventoryService;