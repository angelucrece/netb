const db = require('../../config/database');

class StockMovementRepository {

  static async create(data) {
    const query = `
      INSERT INTO stock_movements 
      (product_id, site_id, type, quantity, user_id, reason, reference_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *`;

    const values = [
      data.productId,
      data.siteId,
      data.type,
      data.quantity,
      data.userId,
      data.reason,
      data.referenceId || null
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  // 🔥 historique avec filtres + pagination
  static async findAll(filters) {
    let query = `SELECT * FROM stock_movements WHERE 1=1`;
    let values = [];
    let i = 1;

    if (filters.productId) {
      query += ` AND product_id = $${i++}`;
      values.push(filters.productId);
    }

    if (filters.siteId) {
      query += ` AND site_id = $${i++}`;
      values.push(filters.siteId);
    }

    if (filters.type) {
      query += ` AND type = $${i++}`;
      values.push(filters.type);
    }

    if (filters.startDate) {
      query += ` AND created_at >= $${i++}`;
      values.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ` AND created_at <= $${i++}`;
      values.push(filters.endDate);
    }

    query += ` ORDER BY validated_at DESC LIMIT $${i++} OFFSET $${i++}`;
    values.push(filters.limit || 10, filters.offset || 0);

    const result = await db.query(query, values);
    return result.rows;
  }

  // 🔥 statistiques
  static async getStats(filters) {
    let query = `
      SELECT 
        type,
        COUNT(*) as total,
        SUM(quantity) as total_quantity
      FROM stock_movements
      WHERE 1=1
    `;

    let values = [];
    let i = 1;

    if (filters.siteId) {
      query += ` AND site_id = $${i++}`;
      values.push(filters.siteId);
    }

    query += ` GROUP BY type`;

    const result = await db.query(query, values);
    return result.rows;
  }
}

module.exports = StockMovementRepository;