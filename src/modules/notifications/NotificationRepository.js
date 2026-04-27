const db = require('../../config/database');

class NotificationRepository {

  static async findByUser(user_id, { read, limit, offset }) {
    const conds = [`user_id = $1`];
    const vals  = [user_id];
    let i = 2;
    if (read !== undefined) { conds.push(`read = $${i++}`); vals.push(read === 'true' || read === true); }
    const { rows } = await db.query(
      `SELECT * FROM notifications WHERE ${conds.join(' AND ')}
       ORDER BY created_at DESC LIMIT $${i} OFFSET $${i+1}`,
      [...vals, limit, offset]
    );
    return rows;
  }

  static async countUnread(user_id) {
    const { rows } = await db.query(
      `SELECT COUNT(*)::int AS count FROM notifications WHERE user_id=$1 AND read=false`, [user_id]
    );
    return rows[0].count;
  }

  static async create({ user_id, title, body, type, reference_id, reference_type }) {
    const { rows } = await db.query(
      `INSERT INTO notifications (user_id, title, body, type, reference_id, reference_type)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [user_id, title, body||null, type||'system', reference_id||null, reference_type||null]
    );
    return rows[0];
  }

  static async markRead(id, user_id) {
    const { rows } = await db.query(
      `UPDATE notifications SET read=true WHERE id=$1 AND user_id=$2 RETURNING *`,
      [id, user_id]
    );
    return rows[0] || null;
  }

  static async markAllRead(user_id) {
    await db.query(`UPDATE notifications SET read=true WHERE user_id=$1`, [user_id]);
  }

  static async delete(id, user_id) {
    const { rows } = await db.query(
      `DELETE FROM notifications WHERE id=$1 AND user_id=$2 RETURNING id`, [id, user_id]
    );
    return rows[0] || null;
  }

  static async saveFcmToken(user_id, fcm_token) {
    await db.query(`UPDATE users SET fcm_token=$1 WHERE id=$2`, [fcm_token, user_id]);
  }
}

module.exports = NotificationRepository;
