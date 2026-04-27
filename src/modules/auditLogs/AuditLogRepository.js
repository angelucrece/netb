const db = require('../../config/database');

class AuditLogRepository {

  static async findAll({ user_id, action, entity_type, entity_id, date_from, date_to, limit, offset }) {
    const conds = [];
    const vals  = [];
    let i = 1;

    if (user_id)     { conds.push(`al.user_id = $${i++}`);      vals.push(user_id); }
    if (action)      { conds.push(`al.action ILIKE $${i++}`);   vals.push(`%${action}%`); }
    if (entity_type) { conds.push(`al.entity_type = $${i++}`);  vals.push(entity_type); }
    if (entity_id)   { conds.push(`al.entity_id = $${i++}`);    vals.push(entity_id); }
    if (date_from)   { conds.push(`al.created_at >= $${i++}`);  vals.push(date_from); }
    if (date_to)     { conds.push(`al.created_at <= $${i++}`);  vals.push(date_to); }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const { rows } = await db.query(
      `SELECT al.*,
              u.first_name || ' ' || u.last_name AS user_name,
              u.email AS user_email
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       ${where}
       ORDER BY al.created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...vals, limit, offset]
    );
    return rows;
  }

  static async count({ user_id, action, entity_type, entity_id, date_from, date_to }) {
    const conds = [];
    const vals  = [];
    let i = 1;

    if (user_id)     { conds.push(`user_id = $${i++}`);     vals.push(user_id); }
    if (action)      { conds.push(`action ILIKE $${i++}`);  vals.push(`%${action}%`); }
    if (entity_type) { conds.push(`entity_type = $${i++}`); vals.push(entity_type); }
    if (entity_id)   { conds.push(`entity_id = $${i++}`);   vals.push(entity_id); }
    if (date_from)   { conds.push(`created_at >= $${i++}`); vals.push(date_from); }
    if (date_to)     { conds.push(`created_at <= $${i++}`); vals.push(date_to); }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await db.query(
      `SELECT COUNT(*) FROM audit_logs ${where}`, vals
    );
    return parseInt(rows[0].count);
  }

  static async findById(id) {
    const { rows } = await db.query(
      `SELECT al.*,
              u.first_name || ' ' || u.last_name AS user_name,
              u.email AS user_email
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       WHERE al.id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  // Résumé des actions par type (pour dashboard admin)
  static async getSummary({ date_from, date_to }) {
    const conds = [];
    const vals  = [];
    let i = 1;
    if (date_from) { conds.push(`created_at >= $${i++}`); vals.push(date_from); }
    if (date_to)   { conds.push(`created_at <= $${i++}`); vals.push(date_to); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const { rows } = await db.query(
      `SELECT action, entity_type, COUNT(*)::int AS count
       FROM audit_logs
       ${where}
       GROUP BY action, entity_type
       ORDER BY count DESC`,
      vals
    );
    return rows;
  }
}

module.exports = AuditLogRepository;
