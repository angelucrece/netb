
// modules/sites/siteRepository.js
// Description : Accès aux sites dans la base PostgreSQL

const db = require('../../config/database');
const Site = require('./siteModel');

class SiteRepository {
  // Récupérer tous les sites
  static async findAll() {
    const result = await db.query('SELECT * FROM sites ORDER BY id ASC');
    return result.rows.map(row => new Site(row));
  }

  // Récupérer un site par id
  static async findById(id) {
    const result = await db.query('SELECT * FROM sites WHERE id = $1', [id]);
    if (!result.rows.length) return null;
    return new Site(result.rows[0]);
  }

  // Récupérer un site par nom
  static async findByName(name) {
    const result = await db.query('SELECT * FROM sites WHERE name = $1', [name]);
    if (!result.rows.length) return null;
    return new Site(result.rows[0]);
  }

  // Créer un nouveau site
  static async create({ name, description, created_at, adress, city, postal_code, country, responsible_name, responsible_email, responsible_phone, type }) {
    const result = await db.query(
      'INSERT INTO sites (name, description, created_at, adress, city, postal_code, country, responsible_name, responsible_email, responsible_phone, type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [name, description, created_at, adress, city, postal_code, country, responsible_name, responsible_email, responsible_phone, type]
    );
    return new Site(result.rows[0]);
  }

  // Mettre à jour un site
  static async update(id, fields) {
    const updates = [];
    const values = [];
    let idx = 1;

    for (let key in fields) {
      updates.push(`${key} = $${idx}`);
      values.push(fields[key]);
      idx++;
    }

    if (!updates.length) return await this.findById(id);

    values.push(id);
    const query = `UPDATE sites SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
    const result = await db.query(query, values);
    return new Site(result.rows[0]);
  }

  // Supprimer un site
  static async delete(id) {
    await db.query('DELETE FROM sites WHERE id = $1', [id]);
    return true;
  }
}

module.exports = SiteRepository;