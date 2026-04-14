const db = require('../../config/database');

class InventoryRepository {

  static async create(data) {
    const query = `
      INSERT INTO inventories 
      (product_id, site_id, system_quantity, real_quantity, difference, user_id)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *`;

    const values = [
      data.productId,
      data.siteId,
      data.systemQuantity,
      data.realQuantity,
      data.difference,
      data.userId
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findAll(filters) {
    let query = `SELECT * FROM inventories WHERE 1=1`;
    let values = [];
    let i = 1;

    if (filters.siteId) {
      query += ` AND site_id = $${i++}`;
      values.push(filters.siteId);
    }

    if (filters.productId) {
      query += ` AND product_id = $${i++}`;
      values.push(filters.productId);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await db.query(query, values);
    return result.rows;
  }
}

module.exports = InventoryRepository;