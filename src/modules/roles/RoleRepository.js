// modules/roles/role.repository.js
// Description : Accès aux rôles dans la base PostgreSQL

const db = require('../../config/database');
const Role = require('./RoleModel');

class RoleRepository {
  // Récupérer tous les rôles
  static async findAll() {
    const result = await db.query('SELECT * FROM roles ORDER BY id ASC');
    return result.rows.map(row => new Role(row));
  }

  // Récupérer un rôle par id
  static async findById(id) {
    const result = await db.query('SELECT * FROM roles WHERE id = $1', [id]);
    if (!result.rows.length) return null;
    return new Role(result.rows[0]);
  }

  // Récupérer un rôle par nom
  static async findByName(name) {
    const result = await db.query('SELECT * FROM roles WHERE name = $1', [name]);
    if (!result.rows.length) return null;
    return new Role(result.rows[0]);
  }

  // Créer un nouveau rôle
  static async create({ name, description }) {
    const result = await db.query(
      'INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    return new Role(result.rows[0]);
  }

  // Mettre à jour un rôle
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
    const query = `UPDATE roles SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
    const result = await db.query(query, values);
    return new Role(result.rows[0]);
  }

  // Supprimer un rôle
  static async delete(id) {
    await db.query('DELETE FROM roles WHERE id = $1', [id]);
    return true;
  }
}

module.exports = RoleRepository;