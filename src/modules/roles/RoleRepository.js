const db = require('../../config/database');

class RoleRepository {
  static async findAll() {
    const { rows } = await db.query('SELECT * FROM roles ORDER BY level ASC');
    return rows;
  }

  static async findById(id) {
    const { rows } = await db.query('SELECT * FROM roles WHERE id = $1', [id]);
    return rows[0] || null;
  }
}

module.exports = RoleRepository;
