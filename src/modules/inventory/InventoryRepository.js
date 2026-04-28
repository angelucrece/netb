const db = require('../../config/database');

class InventoryRepository {

  // ── Sessions ────────────────────────────────────────────
  static async findSessions({ site_id, status, limit, offset }) {
    const conds = [];
    const vals  = [];
    let i = 1;
    if (site_id) { conds.push(`s.site_id = $${i++}`); vals.push(site_id); }
    if (status)  { conds.push(`s.status = $${i++}`);  vals.push(status); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await db.query(
      `SELECT s.*, si.name AS site_name,
              u.first_name || ' ' || u.last_name AS started_by_name
       FROM inventory_sessions s
       JOIN sites si ON si.id = s.site_id
       LEFT JOIN users u ON u.id = s.started_by
       ${where}
       ORDER BY s.started_at DESC
       LIMIT $${i} OFFSET $${i+1}`,
      [...vals, limit, offset]
    );
    return rows;
  }

  static async countSessions({ site_id, status }) {
    const conds = [];
    const vals  = [];
    let i = 1;
    if (site_id) { conds.push(`site_id = $${i++}`); vals.push(site_id); }
    if (status)  { conds.push(`status = $${i++}`);  vals.push(status); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await db.query(
      `SELECT COUNT(*) FROM inventory_sessions ${where}`, vals
    );
    return parseInt(rows[0].count);
  }

  static async findSessionById(id) {
    const { rows } = await db.query(
      `SELECT s.*, si.name AS site_name
       FROM inventory_sessions s
       JOIN sites si ON si.id = s.site_id
       WHERE s.id = $1`, [id]
    );
    return rows[0] || null;
  }

  static async findActiveSession(site_id) {
    const { rows } = await db.query(
      `SELECT * FROM inventory_sessions WHERE site_id=$1 AND status='in_progress' LIMIT 1`,
      [site_id]
    );
    return rows[0] || null;
  }

  static async createSession({ site_id, mode, started_by }) {
    const { rows } = await db.query(
      `INSERT INTO inventory_sessions (site_id, mode, started_by)
       VALUES ($1,$2,$3) RETURNING *`,
      [site_id, mode, started_by]
    );
    return rows[0];
  }

  static async updateSessionStatus(id, status, validated_by, client) {
    const executor = client || db;
    const { rows } = await executor.query(
      `UPDATE inventory_sessions
       SET status=$1, validated_by=$2, ended_at=NOW()
       WHERE id=$3 RETURNING *`,
      [status, validated_by||null, id]
    );
    return rows[0];
  }

  // ── Items ────────────────────────────────────────────────
  static async findItems(session_id) {
    const { rows } = await db.query(
      `SELECT ii.*, p.name AS product_name, p.sku
       FROM inventory_items ii
       JOIN products p ON p.id = ii.product_id
       WHERE ii.session_id = $1
       ORDER BY p.name`, [session_id]
    );
    return rows;
  }

  static async findItemById(id) {
    const { rows } = await db.query(
      `SELECT * FROM inventory_items WHERE id=$1`, [id]
    );
    return rows[0] || null;
  }

  static async createItem({ session_id, product_id, theoretical_qty }) {
    const { rows } = await db.query(
      `INSERT INTO inventory_items (session_id, product_id, theoretical_qty)
       VALUES ($1,$2,$3)
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [session_id, product_id, theoretical_qty]
    );
    return rows[0] || null;
  }

  static async upsertItem({ session_id, product_id, counted_qty, counted_by }) {
    const { rows } = await db.query(
      `INSERT INTO inventory_items (session_id, product_id, theoretical_qty, counted_qty, counted_by, counted_at)
       VALUES ($1, $2,
         (SELECT COALESCE(quantity,0) FROM product_stocks
          WHERE product_id=$2 AND site_id=(SELECT site_id FROM inventory_sessions WHERE id=$1)),
         $3, $4, NOW())
       ON CONFLICT (session_id, product_id)
       DO UPDATE SET counted_qty=$3, counted_by=$4, counted_at=NOW()
       RETURNING *`,
      [session_id, product_id, counted_qty, counted_by]
    );
    return rows[0];
  }

  static async updateItem(id, counted_qty, counted_by) {
    const { rows } = await db.query(
      `UPDATE inventory_items
       SET counted_qty=$1, counted_by=$2, counted_at=NOW()
       WHERE id=$3 RETURNING *`,
      [counted_qty, counted_by, id]
    );
    return rows[0] || null;
  }
}

module.exports = InventoryRepository;
