const db = require('../../config/database');

class SiteRepository {
  static async findAll(activeOnly = true) {
    // `where` est construit exclusivement depuis un booléen interne (jamais depuis req.*).
    // Pas d'interpolation de données utilisateur — pas de risque d'injection SQL.
    // Utilisation d'un paramètre positionnel pour confirmer la lisibilité SonarCloud.
    const { rows } = await db.query(
      'SELECT * FROM sites WHERE ($1::boolean = false OR active = true) ORDER BY name ASC',
      [activeOnly]
    );
    return rows;
  }

  static async findById(id) {
    const { rows } = await db.query(
      `SELECT s.*,
              COUNT(DISTINCT ps.product_id) AS product_count,
              COALESCE(SUM(ps.quantity), 0) AS total_stock
       FROM sites s
       LEFT JOIN product_stocks ps ON ps.site_id = s.id
       WHERE s.id = $1
       GROUP BY s.id`,
      [id]
    );
    return rows[0] || null;
  }

  static async create(data) {
    const { name, type, address, city, postal_code, country,
            responsible_name, responsible_email, responsible_phone } = data;
    const { rows } = await db.query(
      `INSERT INTO sites (name, type, address, city, postal_code, country,
                          responsible_name, responsible_email, responsible_phone)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [name, type, address||null, city||null, postal_code||null,
       country||'Cameroun', responsible_name||null, responsible_email||null, responsible_phone||null]
    );
    return rows[0];
  }

  static async update(id, data) {
    const fields = ['name','type','address','city','postal_code','country',
                    'responsible_name','responsible_email','responsible_phone'];
    const sets   = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
    const vals   = fields.map(f => data[f] ?? null);
    const { rows } = await db.query(
      `UPDATE sites SET ${sets}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...vals]
    );
    return rows[0] || null;
  }

  static async toggle(id, active) {
    const { rows } = await db.query(
      `UPDATE sites SET active = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [active, id]
    );
    return rows[0] || null;
  }

  static async softDelete(id) {
    await db.query(`UPDATE sites SET active = false, updated_at = NOW() WHERE id = $1`, [id]);
  }

  static async hasStock(id) {
    const { rows } = await db.query(
      `SELECT 1 FROM product_stocks WHERE site_id = $1 AND quantity > 0 LIMIT 1`, [id]
    );
    return rows.length > 0;
  }
}

module.exports = SiteRepository;