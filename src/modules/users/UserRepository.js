const db = require('../../config/database');

const SELECT_USER = `
  SELECT u.id, u.email, u.first_name, u.last_name, u.active,
         u.site_id, u.last_login, u.created_at, u.updated_at,
         r.id AS role_id, r.name AS role_name, r.label AS role_label,
         s.id AS s_id, s.name AS site_name, s.type AS site_type
  FROM users u
  LEFT JOIN roles r ON u.role_id = r.id
  LEFT JOIN sites s ON u.site_id = s.id
`;

class UserRepository {

  static async findAll({ search, role_id, site_id, active, limit, offset }) {
    const conds = [];
    const vals  = [];
    let i = 1;

    if (active !== undefined) { conds.push(`u.active = $${i++}`); vals.push(active); }
    if (role_id)  { conds.push(`u.role_id = $${i++}`);  vals.push(role_id); }
    if (site_id)  { conds.push(`u.site_id = $${i++}`);  vals.push(site_id); }
    if (search)   {
      conds.push(`(u.first_name ILIKE $${i} OR u.last_name ILIKE $${i} OR u.email ILIKE $${i})`);
      vals.push(`%${search}%`); i++;
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await db.query(
      `${SELECT_USER} ${where} ORDER BY u.created_at DESC LIMIT $${i} OFFSET $${i+1}`,
      [...vals, limit, offset]
    );
    return rows;
  }

  static async count({ search, role_id, site_id, active }) {
    const conds = [];
    const vals  = [];
    let i = 1;
    if (active !== undefined) { conds.push(`u.active = $${i++}`); vals.push(active); }
    if (role_id)  { conds.push(`u.role_id = $${i++}`);  vals.push(role_id); }
    if (site_id)  { conds.push(`u.site_id = $${i++}`);  vals.push(site_id); }
    if (search)   { conds.push(`(u.first_name ILIKE $${i} OR u.last_name ILIKE $${i} OR u.email ILIKE $${i})`); vals.push(`%${search}%`); i++; }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await db.query(
      `SELECT COUNT(*) FROM users u ${where}`, vals
    );
    return Number.parseInt(rows[0].count);
  }

  static async findById(id) {
    const { rows } = await db.query(`${SELECT_USER} WHERE u.id = $1`, [id]);
    return rows[0] || null;
  }

  static async findByEmail(email) {
    const { rows } = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    return rows[0] || null;
  }

  static async create({ email, password_hash, first_name, last_name, role_id, site_id }) {
    const { rows } = await db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role_id, site_id)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [email, password_hash, first_name, last_name, role_id || null, site_id || null]
    );
    return this.findById(rows[0].id);
  }

  static async update(id, { first_name, last_name, role_id, site_id, active }) {
    const { rows } = await db.query(
      `UPDATE users
       SET first_name=$1, last_name=$2, role_id=$3, site_id=$4, active=$5, updated_at=NOW()
       WHERE id=$6 RETURNING id`,
      [first_name, last_name, role_id||null, site_id||null, active, id]
    );
    return rows[0] ? this.findById(id) : null;
  }

  static async updatePassword(id, password_hash) {
    await db.query(
      `UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2`,
      [password_hash, id]
    );
  }

  static async toggle(id, active) {
    const { rows } = await db.query(
      `UPDATE users SET active=$1, updated_at=NOW() WHERE id=$2 RETURNING id`,
      [active, id]
    );
    return rows[0] ? this.findById(id) : null;
  }

  static async softDelete(id) {
    await db.query(`UPDATE users SET active=false, updated_at=NOW() WHERE id=$1`, [id]);
  }
}

module.exports = UserRepository;
