const db = require('../../config/database');

const runner = (client) => client || db;

class PurchaseRepository {
  static _filters({ supplier_id, site_id, status, date_from, date_to }) {
    const conds = [];
    const vals = [];
    let i = 1;

    if (supplier_id) { conds.push(`po.supplier_id = $${i++}`); vals.push(supplier_id); }
    if (site_id) { conds.push(`po.site_id = $${i++}`); vals.push(site_id); }
    if (status) { conds.push(`po.status = $${i++}`); vals.push(status); }
    if (date_from) { conds.push(`po.created_at >= $${i++}`); vals.push(date_from); }
    if (date_to) { conds.push(`po.created_at <= $${i++}`); vals.push(date_to); }

    return { where: conds.length ? `WHERE ${conds.join(' AND ')}` : '', vals, i };
  }

  static async findAll(filters) {
    const { limit, offset, ...rest } = filters;
    const { where, vals, i } = this._filters(rest);
    const { rows } = await db.query(
      `SELECT po.*, s.name AS supplier_name, st.name AS site_name,
              u.first_name || ' ' || u.last_name AS created_by_name
       FROM purchase_orders po
       LEFT JOIN suppliers s ON s.id = po.supplier_id
       JOIN sites st ON st.id = po.site_id
       LEFT JOIN users u ON u.id = po.created_by
       ${where}
       ORDER BY po.created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...vals, limit, offset]
    );
    return rows;
  }

  static async count(filters) {
    const { where, vals } = this._filters(filters);
    const { rows } = await db.query(
      `SELECT COUNT(*) FROM purchase_orders po ${where}`,
      vals
    );
    return parseInt(rows[0].count, 10);
  }

  static async findById(id) {
    const { rows } = await db.query(
      `SELECT po.*, s.name AS supplier_name, st.name AS site_name
       FROM purchase_orders po
       LEFT JOIN suppliers s ON s.id = po.supplier_id
       JOIN sites st ON st.id = po.site_id
       WHERE po.id = $1`,
      [id]
    );
    if (!rows[0]) return null;

    const items = await db.query(
      `SELECT poi.*, p.name AS product_name, p.sku
       FROM purchase_order_items poi
       JOIN products p ON p.id = poi.product_id
       WHERE poi.purchase_order_id = $1
       ORDER BY poi.id`,
      [id]
    );
    return { ...rows[0], items: items.rows };
  }

  static async create(data, client) {
    const { rows } = await runner(client).query(
      `INSERT INTO purchase_orders
        (supplier_id, site_id, reference, status, expected_at, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id`,
      [
        data.supplier_id || null,
        data.site_id,
        data.reference || null,
        data.status || 'draft',
        data.expected_at || null,
        data.notes || null,
        data.created_by || null,
      ]
    );
    return rows[0].id;
  }

  static async addItems(purchase_order_id, items, client) {
    for (const item of items) {
      await runner(client).query(
        `INSERT INTO purchase_order_items
          (purchase_order_id, product_id, quantity, unit_price)
         VALUES ($1,$2,$3,$4)`,
        [purchase_order_id, item.product_id, item.quantity, item.unit_price || 0]
      );
    }
  }

  static async refreshTotal(id, client) {
    await runner(client).query(
      `UPDATE purchase_orders SET total_amount = COALESCE((
         SELECT SUM(line_total) FROM purchase_order_items WHERE purchase_order_id = $1
       ),0), updated_at=NOW()
       WHERE id=$1`,
      [id]
    );
  }

  static async updateStatus(id, status, userId, client) {
    await runner(client).query(
      `UPDATE purchase_orders
       SET status=$1,
           received_by = CASE WHEN $1 IN ('received','partially_received') THEN $2 ELSE received_by END,
           received_at = CASE WHEN $1 IN ('received','partially_received') THEN NOW() ELSE received_at END,
           updated_at=NOW()
       WHERE id=$3`,
      [status, userId || null, id]
    );
  }
}

module.exports = PurchaseRepository;
