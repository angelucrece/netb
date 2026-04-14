


// StockService.js
// ===== Logique métier et vérifications avant d’appeler le repository =====
const StockRepository = require('./StockRepository');
const ProductService = require('../products/ProductService');
const SiteService = require('../sites/siteService');
const db=require('../../config/database');
const logger = require('../../config/logger');
const StockMovementService = require('../stockMovement/StockMovementService');

class StockService {

  // Récupérer tous les stocks avec filtres
  static async getStocks(filters) {
    return await StockRepository.getAll(filters);
  }

  // Ajouter du stock
  static async addStock({ product_id, site_id, quantity, threshold }) {
    // Vérification que le produit existe
    const product = await ProductService.getById(product_id);
    if (!product) throw new Error(`Produit avec ID ${product_id} introuvable`);

    // Vérification que le site existe
    const site = await SiteService.getSiteById(site_id);
    if (!site) throw new Error(`Site avec ID ${site_id} introuvable`);

    // Vérifier si le stock existe déjà pour ce produit et site
    const existingStock = await StockRepository.getByProductAndSite(product_id, site_id);
    if (existingStock) {
      // Si déjà existant, on ajoute à la quantité
      existingStock.quantity += quantity;
      existingStock.threshold = threshold ?? existingStock.threshold;
      return await StockRepository.update(existingStock.id, existingStock);
    }

    // Sinon créer un nouveau stock
    return await StockRepository.add({ product_id, site_id, quantity, threshold });
  }

  // Retirer du stock
  static async removeStock({ product_id, site_id, quantity }) {
    const stock = await StockRepository.getByProductAndSite(product_id, site_id);
    if (!stock) throw new Error('Stock inexistant pour ce produit et site');

    if (stock.quantity < quantity) {
      throw new Error('Quantité insuffisante dans le stock');
    }

    stock.quantity -= quantity;
    return await StockRepository.update(stock.id, stock);
  }

  //modifier la quantité de stock
  static async updateStock({ product_id, site_id, quantity }) {
    const stock = await StockRepository.getByProductAndSite(product_id, site_id);
    if (!stock) throw new Error('Stock inexistant pour ce produit et site');

    stock.quantity = quantity;
    return await StockRepository.update(stock.id, stock);
  }
  
  // Transférer du stock entre sites

   static async transferStock({ productId, fromSiteId, toSiteId, quantity, userId }) {

    return db.transaction(async (client) => {
      try {
        logger.info('Début transfert', {
          productId,
          fromSiteId,
          toSiteId,
          quantity,
          userId
        });

        // 1. Vérifier stock source
        const stockResult = await client.query(
          `SELECT quantity FROM stocks WHERE product_id=$1 AND site_id=$2`,
          [productId, fromSiteId]
        );

        if (!stockResult.rows.length) {
          throw new Error('Stock source introuvable');
        }

        const available = stockResult.rows[0].quantity;

        if (available < quantity) {
          throw new Error('Stock insuffisant pour transfert');
        }

        // 2. Décrémenter source
        await client.query(
          `UPDATE stocks SET quantity = quantity - $1 WHERE product_id=$2 AND site_id=$3`,
          [quantity, productId, fromSiteId]
        );

        // 3. Incrémenter destination
        await client.query(
          `UPDATE stocks SET quantity = quantity + $1 WHERE product_id=$2 AND site_id=$3`,
          [quantity, productId, toSiteId]
        );

        // 4. Mouvement sortie
        await StockMovementService.createMovement({
          productId,
          siteId: fromSiteId,
          quantity,
          userId,
          type: 'exit',
          reason: 'Transfert sortant'
        });

        // 5. Mouvement entrée
        await StockMovementService.createMovement({
          productId,
          siteId: toSiteId,
          quantity,
          userId,
          type: 'entry',
          reason: 'Transfert entrant'
        });

        logger.info('Transfert réussi', {
          productId,
          quantity
        });

        return { message: 'Transfert effectué avec succès' };

      } catch (error) {
        logger.error('Erreur transfert', {
          error: error.message
        });
        throw error;
      }
    });
  }
}

module.exports = StockService;