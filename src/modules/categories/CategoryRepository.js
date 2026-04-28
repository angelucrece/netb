const db = require('../../config/database');

class CategoryRepository {

  static async findAll({ site_id, search, limit, offset }) {
    const conds = ['c.active = true'];
    const vals  = [];
    let i = 1;

    if (site_id) { conds.push(`(c.site_id = $${i} OR c.site_id IS NULL)`); vals.push(site_id); i++; }
    if (search)  { conds.push(`c.name ILIKE $${i}`); vals.push(`%${search}%`); i++; }

    const where = `WHERE ${conds.join(' AND ')}`;
    const { rows } = await db.query(
      `SELECT c.*, COUNT(p.id)::int AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.active = true
       ${where}
       GROUP BY c.id
       ORDER BY c.name
       LIMIT $${i} OFFSET $${i+1}`,
      [...vals, limit, offset]
    );
    return rows;
  }

  static async count({ site_id, search }) {
    const conds = ['c.active = true'];
    const vals  = [];
    let i = 1;
    if (site_id) { conds.push(`(c.site_id = $${i} OR c.site_id IS NULL)`); vals.push(site_id); i++; }
    if (search)  { conds.push(`c.name ILIKE $${i}`); vals.push(`%${search}%`); i++; }
    const { rows } = await db.query(
      `SELECT COUNT(*) FROM categories c WHERE ${conds.join(' AND ')}`, vals
    );
    return parseInt(rows[0].count);
  }

  static async findById(id) {
    const { rows } = await db.query(
      `SELECT c.*, COUNT(p.id)::int AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.active = true
       WHERE c.id = $1
       GROUP BY c.id`,
      [id]
    );
    return rows[0] || null;
  }

  static async findByName(name, excludeId = null) {
    const { rows } = await db.query(
      `SELECT id FROM categories WHERE LOWER(name) = LOWER($1) ${excludeId ? 'AND id != $2' : ''}`,
      excludeId ? [name, excludeId] : [name]
    );
    return rows[0] || null;
  }

  static async create({ name, description, site_id }) {
    const { rows } = await db.query(
      `INSERT INTO categories (name, description, site_id)
       VALUES ($1,$2,$3) RETURNING *`,
      [name, description || null, site_id || null]
    );
    return rows[0];
  }

  static async update(id, { name, description, site_id }) {
    const { rows } = await db.query(
      `UPDATE categories SET name=$1, description=$2, site_id=$3, updated_at=NOW()
       WHERE id=$4 RETURNING *`,
      [name, description || null, site_id || null, id]
    );
    return rows[0] || null;
  }

  static async softDelete(id) {
    await db.query(`UPDATE categories SET active=false, updated_at=NOW() WHERE id=$1`, [id]);
  }

  static async hasProducts(id) {
    const { rows } = await db.query(
      `SELECT 1 FROM products WHERE category_id=$1 AND active=true LIMIT 1`, [id]
    );
    return rows.length > 0;
  }
}

module.exports = CategoryRepository;
