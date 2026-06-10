const db = require('../../config/database');

const SELECT_PRODUCT = `
  SELECT p.*,
         c.name AS category_name,
         COALESCE(SUM(ps.quantity), 0)::int AS total_stock
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN product_stocks ps ON ps.product_id = p.id
`;

class ProductRepository {

  static async findAll({ search, category_id, site_id, alert, limit, offset }) {
    const conds = ['p.active = true'];
    const vals  = [];
    let i = 1;

    if (search)      { conds.push(`(p.name ILIKE $${i} OR p.sku ILIKE $${i} OR p.barcode ILIKE $${i})`); vals.push(`%${search}%`); i++; }
    if (category_id) { conds.push(`p.category_id = $${i}`); vals.push(category_id); i++; }
    if (site_id)     { conds.push(`ps.site_id = $${i}`); vals.push(site_id); i++; }
    if (alert === 'true') { conds.push(`ps.quantity <= ps.min_stock`); }

    const where = `WHERE ${conds.join(' AND ')}`;
    const { rows } = await db.query(
      `${SELECT_PRODUCT} ${where}
       GROUP BY p.id, c.name
       ORDER BY p.name
       LIMIT $${i} OFFSET $${i+1}`,
      [...vals, limit, offset]
    );
    return rows;
  }

  static async count({ search, category_id, site_id, alert }) {
    const conds = ['p.active = true'];
    const vals  = [];
    let i = 1;
    if (search)      { conds.push(`(p.name ILIKE $${i} OR p.sku ILIKE $${i} OR p.barcode ILIKE $${i})`); vals.push(`%${search}%`); i++; }
    if (category_id) { conds.push(`p.category_id = $${i}`); vals.push(category_id); i++; }
    if (site_id)     { conds.push(`ps.site_id = $${i}`); vals.push(site_id); i++; }
    if (alert === 'true') { conds.push(`ps.quantity <= ps.min_stock`); }
    const { rows } = await db.query(
      `SELECT COUNT(DISTINCT p.id) FROM products p
       LEFT JOIN product_stocks ps ON ps.product_id = p.id
       WHERE ${conds.join(' AND ')}`, vals
    );
    return Number.parseInt(rows[0].count);
  }

  static async findById(id) {
    const { rows } = await db.query(
      `${SELECT_PRODUCT}
       LEFT JOIN product_variants pv ON pv.product_id = p.id
       WHERE p.id = $1 AND p.active = true
       GROUP BY p.id, c.name`,
      [id]
    );
    if (!rows[0]) return null;
    // Charger variantes et stocks par site séparément
    const [variants, stocks] = await Promise.all([
      db.query(`SELECT * FROM product_variants WHERE product_id=$1`, [id]),
      db.query(
        `SELECT ps.*, s.name AS site_name FROM product_stocks ps
         JOIN sites s ON s.id = ps.site_id WHERE ps.product_id=$1`, [id]
      ),
    ]);
    return { ...rows[0], variants: variants.rows, stocks: stocks.rows };
  }

  static async findByBarcode(barcode) {
    const { rows } = await db.query(
      `${SELECT_PRODUCT} WHERE p.barcode=$1 AND p.active=true GROUP BY p.id, c.name`, [barcode]
    );
    return rows[0] || null;
  }

  static async findBySku(sku) {
    const { rows } = await db.query('SELECT id FROM products WHERE sku=$1', [sku]);
    return rows[0] || null;
  }

  static async findAlerts(site_id) {
    const cond = site_id ? 'AND ps.site_id = $1' : '';
    const vals = site_id ? [site_id] : [];
    const { rows } = await db.query(
      `SELECT p.id, p.name, p.sku, ps.quantity, ps.min_stock, s.name AS site_name
       FROM product_stocks ps
       JOIN products p ON p.id = ps.product_id
       JOIN sites s ON s.id = ps.site_id
       WHERE ps.quantity <= ps.min_stock AND p.active=true ${cond}
       ORDER BY ps.quantity ASC`, vals
    );
    return rows;
  }

  static async create({ sku, barcode, name, brand, unit, description, category_id,
                        purchase_price, sale_price, photo_url, qr_code_url }) {
    const { rows } = await db.query(
      `INSERT INTO products (sku, barcode, name, brand, unit, description, category_id,
                             purchase_price, sale_price, photo_url, qr_code_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [sku, barcode||null, name, brand||null, unit||'piece', description||null,
       category_id||null, purchase_price||0, sale_price||0, photo_url||null, qr_code_url||null]
    );
    return this.findById(rows[0].id);
  }

  static async update(id, { name, brand, unit, description, category_id,
                             purchase_price, sale_price, barcode }) {
    await db.query(
      `UPDATE products SET name=$1, brand=$2, unit=$3, description=$4, category_id=$5,
                           purchase_price=$6, sale_price=$7, barcode=$8, updated_at=NOW()
       WHERE id=$9`,
      [name, brand||null, unit||'piece', description||null, category_id||null,
       purchase_price||0, sale_price||0, barcode||null, id]
    );
    return this.findById(id);
  }

  static async updatePhoto(id, photo_url) {
    await db.query(`UPDATE products SET photo_url=$1, updated_at=NOW() WHERE id=$2`, [photo_url, id]);
    return this.findById(id);
  }

  static async upsertVariants(product_id, variants) {
    await db.query(`DELETE FROM product_variants WHERE product_id=$1`, [product_id]);
    for (const v of variants) {
      await db.query(
        `INSERT INTO product_variants (product_id, variant_type, variant_value, sku_suffix)
         VALUES ($1,$2,$3,$4)`,
        [product_id, v.type, v.value, v.sku_suffix||null]
      );
    }
  }

  static async softDelete(id) {
    await db.query(`UPDATE products SET active=false, updated_at=NOW() WHERE id=$1`, [id]);
  }
}

module.exports = ProductRepository;
