
// StockRepository.js
// ===== Interaction avec la base de données pour les stocks =====
const db = require('../../config/database'); // instance pg Pool
const Stock = require('./StockModel');

class StockRepository {

  // Obtenir tous les stocks avec option de filtrage par site ou produit
 static  async getAll(filters = {}) {
    let query = 'SELECT * FROM stocks WHERE 1=1';
    const params = [];
    let i = 1;

    if (filters.site_id) {
      query += ` AND site_id = $${i++}`;
      params.push(filters.site_id);
    }
    if (filters.product_id) {
      query += ` AND product_id = $${i++}`;
      params.push(filters.product_id);
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);
    return result.rows.map(row => new Stock(row));
  }

  // Obtenir un stock spécifique par product_id et site_id
  static async getByProductAndSite(product_id, site_id) {
    const query = 'SELECT * FROM stocks WHERE product_id=$1 AND site_id=$2';
    const result = await db.query(query, [product_id, site_id]);
    return result.rows[0] ? new Stock(result.rows[0]) : null;
  }

  // Ajouter un stock
  static async add(stockData) {
    const query = `
      INSERT INTO stocks (product_id, site_id, quantity, threshold)
      VALUES ($1, $2, $3, $4)
      RETURNING *`;
    const { product_id, site_id, quantity, threshold } = stockData;

    const result = await db.query(query, [product_id, site_id, quantity, threshold]);
    return new Stock(result.rows[0]);
  }

  // Mettre à jour un stock existant
  static async update(stockId, updateData) {
    const { quantity, threshold } = updateData;
    const query = `
      UPDATE stocks
      SET quantity=$1, threshold=$2, updated_at=NOW()
      WHERE id=$3
      RETURNING *`;
    const result = await db.query(query, [quantity, threshold, stockId]);
    return new Stock(result.rows[0]);
  }

  // Supprimer un stock
  static async delete(stockId) {
    const query = 'DELETE FROM stocks WHERE id=$1';
    await db.query(query, [stockId]);
  }
}

module.exports = StockRepository;