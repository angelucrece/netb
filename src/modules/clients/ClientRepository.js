const db = require('../../config/database');

class ClientRepository {
  static async findAll({ search, type, active, limit, offset }) {
    const conds = [];
    const vals = [];
    let i = 1;

    if (active !== undefined) {
      conds.push(`active = $${i++}`);
      vals.push(String(active) === 'true'); // conversion explicite string/boolean
    } else {
      conds.push('active = true');
    }

    if (type) {
      conds.push(`type = $${i++}`);
      vals.push(type);
    }

    if (search) {
      conds.push(`(name ILIKE $${i} OR contact_name ILIKE $${i} OR phone ILIKE $${i} OR email ILIKE $${i})`);
      vals.push(`%${search}%`);
      i++;
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await db.query(
      `SELECT * FROM clients ${where}
       ORDER BY type, name
       LIMIT $${i} OFFSET $${i + 1}`,
      [...vals, limit, offset]
    );
    return rows;
  }

  static async count({ search, type, active }) {
    const conds = [];
    const vals = [];
    let i = 1;

    if (active !== undefined) {
      conds.push(`active = $${i++}`);
      vals.push(String(active) === 'true'); // conversion explicite string/boolean
    } else {
      conds.push('active = true');
    }

    if (type) {
      conds.push(`type = $${i++}`);
      vals.push(type);
    }

    if (search) {
      conds.push(`(name ILIKE $${i} OR contact_name ILIKE $${i} OR phone ILIKE $${i} OR email ILIKE $${i})`);
      vals.push(`%${search}%`);
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await db.query(`SELECT COUNT(*) FROM clients ${where}`, vals);
    return Number.parseInt(rows[0].count, 10);
  }

  static async findById(id) {
    const { rows } = await db.query('SELECT * FROM clients WHERE id = $1', [id]);
    return rows[0] || null;
  }

  static async create(data) {
    const { rows } = await db.query(
      `INSERT INTO clients
        (type, name, contact_name, email, phone, address, city, tax_number,
         payment_terms_days, discount_rate, credit_limit, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING id`,
      [
        data.type || 'occasional',
        data.name,
        data.contact_name || null,
        data.email || null,
        data.phone || null,
        data.address || null,
        data.city || null,
        data.tax_number || null,
        data.payment_terms_days || 0,
        data.discount_rate || 0,
        data.credit_limit || 0,
        data.notes || null,
      ]
    );
    return this.findById(rows[0].id);
  }

  static async update(id, data) {
    await db.query(
      `UPDATE clients SET
         type=$1, name=$2, contact_name=$3, email=$4, phone=$5, address=$6,
         city=$7, tax_number=$8, payment_terms_days=$9, discount_rate=$10,
         credit_limit=$11, notes=$12, updated_at=NOW()
       WHERE id=$13`,
      [
        data.type || 'occasional',
        data.name,
        data.contact_name || null,
        data.email || null,
        data.phone || null,
        data.address || null,
        data.city || null,
        data.tax_number || null,
        data.payment_terms_days || 0,
        data.discount_rate || 0,
        data.credit_limit || 0,
        data.notes || null,
        id,
      ]
    );
    return this.findById(id);
  }

  static async setActive(id, active) {
    await db.query(
      'UPDATE clients SET active=$1, updated_at=NOW() WHERE id=$2',
      [active, id]
    );
    return this.findById(id);
  }
}

module.exports = ClientRepository;