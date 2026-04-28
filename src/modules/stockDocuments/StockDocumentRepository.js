const db = require('../../config/database');

class StockDocumentRepository {

  static async findAll({ type, site_id, status, limit, offset }) {
    const conds = [];
    const vals  = [];
    let i = 1;
    if (type)    { conds.push(`d.type = $${i++}`);    vals.push(type); }
    if (site_id) { conds.push(`d.site_id = $${i++}`); vals.push(site_id); }
    if (status)  { conds.push(`d.status = $${i++}`);  vals.push(status); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await db.query(
      `SELECT d.*, s.name AS site_name,
              u.first_name || ' ' || u.last_name AS created_by_name
       FROM stock_documents d
       JOIN sites s ON s.id = d.site_id
       LEFT JOIN users u ON u.id = d.created_by
       ${where}
       ORDER BY d.created_at DESC
       LIMIT $${i} OFFSET $${i+1}`,
      [...vals, limit, offset]
    );
    return rows;
  }

  static async count({ type, site_id, status }) {
    const conds = [];
    const vals  = [];
    let i = 1;
    if (type)    { conds.push(`type = $${i++}`);    vals.push(type); }
    if (site_id) { conds.push(`site_id = $${i++}`); vals.push(site_id); }
    if (status)  { conds.push(`status = $${i++}`);  vals.push(status); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await db.query(`SELECT COUNT(*) FROM stock_documents ${where}`, vals);
    return parseInt(rows[0].count);
  }

  static async findById(id) {
    const { rows } = await db.query(
      `SELECT d.*, s.name AS site_name
       FROM stock_documents d
       JOIN sites s ON s.id = d.site_id
       WHERE d.id = $1`, [id]
    );
    if (!rows[0]) return null;
    const items = await db.query(
      `SELECT di.*, p.name AS product_name, p.sku
       FROM stock_document_items di
       JOIN products p ON p.id = di.product_id
       WHERE di.document_id = $1`, [id]
    );
    return { ...rows[0], items: items.rows };
  }

  static async create({ type, site_id, destination_site_id, reference, notes, created_by }) {
    const { rows } = await db.query(
      `INSERT INTO stock_documents (type, site_id, destination_site_id, reference, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [type, site_id, destination_site_id||null, reference||null, notes||null, created_by]
    );
    return rows[0].id;
  }

  static async addItems(document_id, items) {
    for (const item of items) {
      await db.query(
        `INSERT INTO stock_document_items (document_id, product_id, quantity, unit_price)
         VALUES ($1,$2,$3,$4)`,
        [document_id, item.product_id, item.quantity, item.unit_price||0]
      );
    }
  }

  static async updateStatus(id, status, validated_by) {
    await db.query(
      `UPDATE stock_documents SET status=$1, validated_by=$2, validated_at=NOW() WHERE id=$3`,
      [status, validated_by||null, id]
    );
  }
}

module.exports = StockDocumentRepository;
