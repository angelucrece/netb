const db = require('../../config/database');

class StockRepository {

  static async findAll({ site_id, product_id, alert, limit, offset }) {
    const conds = ['p.active = true'];
    const vals  = [];
    let i = 1;
    if (site_id)    { conds.push(`ps.site_id = $${i}`);    vals.push(site_id);    i++; }
    if (product_id) { conds.push(`ps.product_id = $${i}`); vals.push(product_id); i++; }
    if (alert === 'true') { conds.push(`ps.quantity <= ps.min_stock`); }

    const { rows } = await db.query(
      `SELECT ps.*, p.name AS product_name, p.sku, s.name AS site_name
       FROM product_stocks ps
       JOIN products p ON p.id = ps.product_id
       JOIN sites s ON s.id = ps.site_id
       WHERE ${conds.join(' AND ')}
       ORDER BY p.name
       LIMIT $${i} OFFSET $${i+1}`,
      [...vals, limit || 50, offset || 0]
    );
    return rows;
  }

  static async findByProductAndSite(product_id, site_id) {
    const { rows } = await db.query(
      `SELECT * FROM product_stocks WHERE product_id=$1 AND site_id=$2`,
      [product_id, site_id]
    );
    return rows[0] || null;
  }

  // INSERT ou UPDATE si déjà existant
  static async upsert(product_id, site_id, quantity, min_stock, max_stock, location) {
    const { rows } = await db.query(
      `INSERT INTO product_stocks (product_id, site_id, quantity, min_stock, max_stock, location)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (product_id, site_id)
       DO UPDATE SET quantity = product_stocks.quantity + EXCLUDED.quantity,
                     min_stock = COALESCE(EXCLUDED.min_stock, product_stocks.min_stock),
                     max_stock = COALESCE(EXCLUDED.max_stock, product_stocks.max_stock),
                     location  = COALESCE(EXCLUDED.location,  product_stocks.location),
                     updated_at = NOW()
       RETURNING *`,
      [product_id, site_id, quantity, min_stock||0, max_stock||9999, location||null]
    );
    return rows[0];
  }

  static async adjustQuantity(product_id, site_id, delta, client) {
    const executor = client || db;
    const { rows } = await executor.query(
      `UPDATE product_stocks SET quantity = quantity + $1, updated_at = NOW()
       WHERE product_id=$2 AND site_id=$3
       RETURNING *`,
      [delta, product_id, site_id]
    );
    return rows[0] || null;
  }

  static async setQuantity(product_id, site_id, quantity, client) {
    const executor = client || db;
    const { rows } = await executor.query(
      `UPDATE product_stocks SET quantity=$1, updated_at=NOW()
       WHERE product_id=$2 AND site_id=$3 RETURNING *`,
      [quantity, product_id, site_id]
    );
    return rows[0] || null;
  }
}

module.exports = StockRepository;
