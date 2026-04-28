const StockRepository = require('./StockRepository');
const ApiError = require('../../utils/ApiError');
const db = require('../../config/database');
const logger = require('../../config/logger');

class StockService {

  static async getStocks(filters) {
    return await StockRepository.findAll(filters);
  }

  static async getByProductAndSite(product_id, site_id) {
    const stock = await StockRepository.findByProductAndSite(product_id, site_id);
    if (!stock) throw ApiError.notFound('Stock introuvable pour ce produit/site');
    return stock;
  }

  static async transfer({ product_id, from_site_id, to_site_id, quantity, userId }) {
    if (from_site_id === to_site_id) throw ApiError.badRequest('Sites source et destination identiques');

    return await db.transaction(async (client) => {
      // Vérifier stock source
      const { rows } = await client.query(
        `SELECT quantity FROM product_stocks WHERE product_id=$1 AND site_id=$2 FOR UPDATE`,
        [product_id, from_site_id]
      );
      if (!rows.length) throw ApiError.notFound('Stock source introuvable');
      if (rows[0].quantity < quantity) throw ApiError.badRequest('Stock insuffisant pour le transfert');

      // Décrémenter source
      await StockRepository.adjustQuantity(product_id, from_site_id, -quantity, client);
      // Incrémenter destination (upsert géré par adjustQuantity si la ligne existe)
      const dest = await client.query(
        `SELECT 1 FROM product_stocks WHERE product_id=$1 AND site_id=$2`, [product_id, to_site_id]
      );
      if (dest.rows.length) {
        await StockRepository.adjustQuantity(product_id, to_site_id, quantity, client);
      } else {
        await client.query(
          `INSERT INTO product_stocks (product_id, site_id, quantity) VALUES ($1,$2,$3)`,
          [product_id, to_site_id, quantity]
        );
      }

      logger.info('[Stocks] Transfert effectué', { product_id, from_site_id, to_site_id, quantity, userId });
      return { message: 'Transfert effectué', product_id, from_site_id, to_site_id, quantity };
    });
  }
}

module.exports = StockService;
