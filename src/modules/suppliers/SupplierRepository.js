const db = require('../../config/database');

class SupplierRepository {
  //
  static async findAll({ search, active, limit, offset }) {
    const conds = [];
    const vals = [];
    let i = 1;

    if (active !== undefined) {
      conds.push(`active = $${i++}`);
      vals.push(active === true || active === 'true');
    } else {
      conds.push('active = true');
    }

    if (search) {
      conds.push(`(name ILIKE $${i} OR contact_name ILIKE $${i} OR phone ILIKE $${i})`);
      vals.push(`%${search}%`);
      i++;
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await db.query(
      `SELECT * FROM suppliers ${where}
       ORDER BY name
       LIMIT $${i} OFFSET $${i + 1}`,
      [...vals, limit, offset]
    );
    return rows;
  }

  static async count({ search, active }) {
    const conds = [];
    const vals = [];
    let i = 1;

    if (active !== undefined) {
      conds.push(`active = $${i++}`);
      vals.push(active === true || active === 'true');
    } else {
      conds.push('active = true');
    }

    if (search) {
      conds.push(`(name ILIKE $${i} OR contact_name ILIKE $${i} OR phone ILIKE $${i})`);
      vals.push(`%${search}%`);
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await db.query(`SELECT COUNT(*) FROM suppliers ${where}`, vals);
    return parseInt(rows[0].count, 10);
  }

  static async findById(id) {
    const { rows } = await db.query('SELECT * FROM suppliers WHERE id = $1', [id]);
    return rows[0] || null;
  }

  static async create(data) {
    const { rows } = await db.query(
      `INSERT INTO suppliers
        (name, contact_name, email, phone, address, city, country, tax_number, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id`,
      [
        data.name,
        data.contact_name || null,
        data.email || null,
        data.phone || null,
        data.address || null,
        data.city || null,
        data.country || 'Cameroun',
        data.tax_number || null,
        data.notes || null,
      ]
    );
    return this.findById(rows[0].id);
  }

  static async update(id, data) {
    await db.query(
      `UPDATE suppliers SET
         name=$1, contact_name=$2, email=$3, phone=$4, address=$5,
         city=$6, country=$7, tax_number=$8, notes=$9, updated_at=NOW()
       WHERE id=$10`,
      [
        data.name,
        data.contact_name || null,
        data.email || null,
        data.phone || null,
        data.address || null,
        data.city || null,
        data.country || 'Cameroun',
        data.tax_number || null,
        data.notes || null,
        id,
      ]
    );
    return this.findById(id);
  }

  static async setActive(id, active) {
    await db.query(
      'UPDATE suppliers SET active=$1, updated_at=NOW() WHERE id=$2',
      [active, id]
    );
    return this.findById(id);
  }
}

module.exports = SupplierRepository;
