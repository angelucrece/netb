const db = require('../../config/database');

/**
 * Repository User = requêtes SQL uniquement
 */
class UserRepository {

  // Récupérer tous les utilisateurs avec filtres
  static async findAll({ search, page, limit, role, site }) {

    const offset = (page - 1) * limit;

    let where = 'WHERE u.active = true';
    let params = [];
    let i = 1;

    // Filtre recherche
    if (search) {
      where += ` AND (
        u.first_name ILIKE $${i}
        OR u.last_name ILIKE $${i}
        OR u.email ILIKE $${i}
      )`;
      params.push(`%${search}%`);
      i++;
    }

    // Filtre rôle
    if (role) {
      where += ` AND r.name = $${i}`;
      params.push(role);
      i++;
    }
    // Filtre site
    if (site) {
      where += ` AND s.name = $${i}`;
      params.push(site);
      i++;
    }

    const query = `
      SELECT 
        u.*, 
        r.id as role_id,
        r.name as role_name,
        r.description,
        s.id as site_id,
        s.name as site_name,
        s.description as site_description,
        s.created_at as site_created_at,
        s.adress as site_adress,
        s.city as site_city,
        s.postal_code as site_postal_code,
        s.country as site_country,
        s.responsible_name as site_responsible_name,
        s.responsible_email as site_responsible_email,
        s.responsible_phone as site_responsible_phone,
        s.type as site_type
      FROM users u
      JOIN roles r ON u.role_id = r.id
      JOIN sites s ON u.site_id = s.id
      ${where}
      ORDER BY u.created_at DESC
      LIMIT $${i} OFFSET $${i + 1}
    `;

    params.push(limit, offset);

    const result = await db.query(query, params);
    return result.rows;
  }

  // Récupérer un utilisateur
  static async findById(id) {
    const result = await db.query(`
      SELECT 
        u.*, 
        r.id as role_id,
        r.name as role_name,
        r.description,
        s.id as site_id,
        s.name as site_name,
        s.description as site_description,
        s.created_at as site_created_at,
        s.adress as site_adress,
        s.city as site_city,
        s.postal_code as site_postal_code,
        s.country as site_country,
        s.responsible_name as site_responsible_name,
        s.responsible_email as site_responsible_email,
        s.responsible_phone as site_responsible_phone,
        s.type as site_type
      FROM users u
      JOIN roles r ON u.role_id = r.id
      JOIN sites s ON u.site_id = s.id
      WHERE u.id = $1 AND u.active = true
    `, [id]);

    return result.rows[0];
  }

  //creer un utilisateur
   static async create({  email,
    first_name,
    last_name,
    role,
    active,
    created_at,
    last_login,
    site }) {
    const result = await db.query(
      'INSERT INTO users ( email,first_name,last_name,role_id,active,created_at,last_login,site_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [ email, first_name, last_name, role_id, active, created_at, last_login, site_id]
    );
    return new User(result.rows[0]);
  }

  // Mettre à jour un utilisateur
  static async update(id, data, client) {
    const result = await client.query(`
      UPDATE users
      SET first_name = $1,
          last_name = $2,
          role_id = $3,
          active = $4,
          site_id = $5,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [
      data.firstName,
      data.lastName,
      data.roleId,
      data.active,
      data.siteId,
      id
    ]);

    return result.rows[0];
  }

  // Désactiver utilisateur (soft delete)
  static async deactivate(id, client) {
    await client.query(
      'UPDATE users SET active = false WHERE id = $1',
      [id]
    );
  }
}

module.exports = UserRepository;