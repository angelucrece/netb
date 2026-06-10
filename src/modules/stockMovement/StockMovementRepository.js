const db = require('../../config/database');

const BASE = `
  SELECT m.*,
         p.name AS product_name, p.sku,
         u.first_name || ' ' || u.last_name AS user_name,
         s.name  AS site_name,
         ds.name AS destination_site_name,
         v.first_name || ' ' || v.last_name AS validator_name
  FROM movements m
  JOIN  products p  ON p.id  = m.product_id
  LEFT JOIN users u  ON u.id  = m.user_id
  LEFT JOIN sites s  ON s.id  = m.site_id
  LEFT JOIN sites ds ON ds.id = m.destination_site_id
  LEFT JOIN users v  ON v.id  = m.validated_by
`;

class MovementRepository {

  static async findAll({ type, site_id, product_id, user_id, status,
                         date_from, date_to, limit, offset }) {
    const conds = [];
    const vals  = [];
    let i = 1;

    if (type)       { conds.push(`m.type = $${i++}`);       vals.push(type); }
    if (site_id)    { conds.push(`m.site_id = $${i++}`);    vals.push(site_id); }
    if (product_id) { conds.push(`m.product_id = $${i++}`); vals.push(product_id); }
    if (user_id)    { conds.push(`m.user_id = $${i++}`);    vals.push(user_id); }
    if (status)     { conds.push(`m.status = $${i++}`);     vals.push(status); }
    if (date_from)  { conds.push(`m.created_at >= $${i++}`); vals.push(date_from); }
    if (date_to)    { conds.push(`m.created_at <= $${i++}`); vals.push(date_to); }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await db.query(
      `${BASE} ${where} ORDER BY m.created_at DESC LIMIT $${i} OFFSET $${i+1}`,
      [...vals, limit, offset]
    );
    return rows;
  }

  static async count({ type, site_id, product_id, user_id, status, date_from, date_to }) {
    const conds = [];
    const vals  = [];
    let i = 1;
    if (type)       { conds.push(`m.type = $${i++}`);       vals.push(type); }
    if (site_id)    { conds.push(`m.site_id = $${i++}`);    vals.push(site_id); }
    if (product_id) { conds.push(`m.product_id = $${i++}`); vals.push(product_id); }
    if (user_id)    { conds.push(`m.user_id = $${i++}`);    vals.push(user_id); }
    if (status)     { conds.push(`m.status = $${i++}`);     vals.push(status); }
    if (date_from)  { conds.push(`m.created_at >= $${i++}`); vals.push(date_from); }
    if (date_to)    { conds.push(`m.created_at <= $${i++}`); vals.push(date_to); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await db.query(
      `SELECT COUNT(*) FROM movements m ${where}`, vals
    );
    return Number.parseInt(rows[0].count);
  }

  static async findById(id) {
    const { rows } = await db.query(`${BASE} WHERE m.id = $1`, [id]);
    return rows[0] || null;
  }

  static async findPending(site_id) {
    const cond = site_id ? 'AND m.site_id = $1' : '';
    const vals = site_id ? [site_id] : [];
    const { rows } = await db.query(
      `${BASE} WHERE m.status = 'pending' ${cond} ORDER BY m.created_at ASC`, vals
    );
    return rows;
  }

  static async create({ type, product_id, site_id, destination_site_id,
                        quantity, user_id, motif, supplier }) {
    const { rows } = await db.query(
      `INSERT INTO movements
         (type, product_id, site_id, destination_site_id, quantity, user_id, motif, supplier)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [type, product_id, site_id, destination_site_id||null,
       quantity, user_id, motif||null, supplier||null]
    );
    return this.findById(rows[0].id);
  }

  static async updateStatus(id, status, validatedBy, rejectionReason, client) {
    const executor = client || db;
    const { rows } = await executor.query(
      `UPDATE movements
       SET status=$1, validated_by=$2, validated_at=NOW(), rejection_reason=$3
       WHERE id=$4 RETURNING id`,
      [status, validatedBy||null, rejectionReason||null, id]
    );
    return rows[0] || null;
  }
}

module.exports = MovementRepository;
