const db = require('../../config/database');

class ReportRepository {

  static async getDashboard(site_id) {
    const cond = site_id ? 'AND ps.site_id = $1' : '';
    const vals = site_id ? [site_id] : [];

    const [stockRes, alertRes, movRes] = await Promise.all([
      db.query(
        `SELECT COUNT(DISTINCT ps.product_id)::int AS total_products,
                COALESCE(SUM(ps.quantity),0)::int  AS total_stock,
                COUNT(DISTINCT ps.site_id)::int    AS total_sites
         FROM product_stocks ps
         JOIN products p ON p.id = ps.product_id AND p.active = true
         ${site_id ? 'WHERE ps.site_id = $1' : ''}`, vals
      ),
      db.query(
        `SELECT COUNT(*)::int AS alert_count
         FROM product_stocks ps
         JOIN products p ON p.id = ps.product_id AND p.active = true
         WHERE ps.quantity <= ps.min_stock ${cond}`, vals
      ),
      db.query(
        `SELECT COUNT(*)::int AS today_movements
         FROM movements
         WHERE created_at >= CURRENT_DATE
         ${site_id ? 'AND site_id = $1' : ''}`, vals
      ),
    ]);

    return {
      ...stockRes.rows[0],
      ...alertRes.rows[0],
      ...movRes.rows[0],
    };
  }

  static async getStockReport({ site_id, category_id }) {
    const conds = ['p.active = true'];
    const vals  = [];
    let i = 1;
    if (site_id)     { conds.push(`ps.site_id = $${i++}`);     vals.push(site_id); }
    if (category_id) { conds.push(`p.category_id = $${i++}`);  vals.push(category_id); }
    const { rows } = await db.query(
      `SELECT p.id, p.sku, p.name, p.unit, c.name AS category,
              ps.quantity, ps.min_stock, ps.max_stock, ps.location,
              s.name AS site_name,
              (ps.quantity <= ps.min_stock) AS is_alert
       FROM product_stocks ps
       JOIN products p ON p.id = ps.product_id
       LEFT JOIN categories c ON c.id = p.category_id
       JOIN sites s ON s.id = ps.site_id
       WHERE ${conds.join(' AND ')}
       ORDER BY s.name, p.name`, vals
    );
    return rows;
  }

  static async getMovementsReport({ site_id, date_from, date_to, type }) {
    const conds = [];
    const vals  = [];
    let i = 1;
    if (site_id)   { conds.push(`m.site_id = $${i++}`);    vals.push(site_id); }
    if (type)      { conds.push(`m.type = $${i++}`);        vals.push(type); }
    if (date_from) { conds.push(`m.created_at >= $${i++}`); vals.push(date_from); }
    if (date_to)   { conds.push(`m.created_at <= $${i++}`); vals.push(date_to); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await db.query(
      `SELECT m.id, m.type, m.quantity, m.status, m.motif, m.created_at,
              p.name AS product_name, p.sku,
              s.name AS site_name,
              u.first_name || ' ' || u.last_name AS user_name
       FROM movements m
       JOIN products p ON p.id = m.product_id
       JOIN sites s ON s.id = m.site_id
       LEFT JOIN users u ON u.id = m.user_id
       ${where}
       ORDER BY m.created_at DESC`, vals
    );
    return rows;
  }

  static async getSitesStockComparison() {
    const { rows } = await db.query(
      `SELECT s.id, s.name AS site_name, s.type,
              COUNT(DISTINCT ps.product_id)::int AS product_count,
              COALESCE(SUM(ps.quantity),0)::int  AS total_stock,
              COUNT(CASE WHEN ps.quantity <= ps.min_stock THEN 1 END)::int AS alert_count
       FROM sites s
       LEFT JOIN product_stocks ps ON ps.site_id = s.id
       WHERE s.active = true
       GROUP BY s.id
       ORDER BY s.name`
    );
    return rows;
  }

  static async getInventoryReport(session_id) {
    const { rows } = await db.query(
      `SELECT ii.*, p.name AS product_name, p.sku,
              u.first_name || ' ' || u.last_name AS counted_by_name
       FROM inventory_items ii
       JOIN products p ON p.id = ii.product_id
       LEFT JOIN users u ON u.id = ii.counted_by
       WHERE ii.session_id = $1
       ORDER BY p.name`, [session_id]
    );
    return rows;
  }
}

module.exports = ReportRepository;
