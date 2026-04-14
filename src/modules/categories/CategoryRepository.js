
// Description : Accès aux données pour les catégories
// Toutes les requêtes SQL sont centralisées ici

const db = require('../../config/database');

class CategoryRepository {

  static async findAll() {
    const query = `
      SELECT 
        c.id, c.name, c.description, c.created_at, c.updated_at,
        COUNT(p.id) as product_count, s.id as site_id,
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
      
      FROM categories c
      
      LEFT JOIN products p ON c.id = p.category_id AND p.active = true
      LEFT JOIN sites s ON c.site_id = s.id
      GROUP BY c.id, c.name, c.description, c.created_at, c.updated_at, s.id
      ORDER BY c.name
    `;
    return db.query(query);
  }

  static async findById(id) {
    const query = `
      SELECT 
        c.id, c.name, c.description, c.created_at, c.updated_at,
        COUNT(p.id) as product_count, s.id as site_id,
        s.name as site_name,
        s.description as site_description
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.active = true
      LEFT JOIN sites s ON c.site_id = s.id
      WHERE c.id = $1
      GROUP BY c.id, c.name, c.description, c.created_at, c.updated_at, s.id
    `;
    return db.query(query, [id]);
  }

  static async findByName(name) {
    return db.query('SELECT id FROM categories WHERE LOWER(name) = LOWER($1)', [name]);
  }

  static async create(client, name, description, site_id) {
    const query = `
      INSERT INTO categories (name, description, site_id)
      VALUES ($1, $2, $3)
      RETURNING id, name, description, site_id, created_at
    `;
    return client.query(query, [name, description, site_id || null]);
  }

  static async update(client, id, name, description, site_id) {
    const query = `
      UPDATE categories
      SET name = $1, description = $2, site_id = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, name, description, site_id, updated_at
    `;
    return client.query(query, [name, description, site_id, id]);
  }

  static async delete(client, id) {
    return client.query('DELETE FROM categories WHERE id = $1', [id]);
  }

  static async countProducts(id) {
    const result = await db.query(
      'SELECT COUNT(*) as count FROM products WHERE category_id = $1 AND active = true',
      [id]
    );
    return parseInt(result.rows[0].count);
  }


  // Recherche avancée avec filtres
  static async search(filters) {
    let query = `
      SELECT 
        c.id, c.name, c.description, c.created_at, c.updated_at,
        s.id as site_id, s.name as site_name,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN sites s ON c.site_id = s.id
      LEFT JOIN products p ON c.id = p.category_id AND p.active = true
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    // Recherche par nom
    if (filters.search) {
      query += ` AND c.name ILIKE $${paramIndex}`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }
    
    // Filtre par site
    if (filters.site_id) {
      query += ` AND c.site_id = $${paramIndex}`;
      params.push(filters.site_id);
      paramIndex++;
    }
    
    // Filtre par nombre de produits minimum
    if (filters.minProducts) {
      query += ` HAVING COUNT(p.id) >= $${paramIndex}`;
      params.push(parseInt(filters.minProducts));
      paramIndex++;
    }
    
    query += ` GROUP BY c.id, c.name, c.description, c.created_at, c.updated_at, s.id, s.name`;
    
    // Tri
    const sortBy = filters.sortBy || 'name';
    const sortOrder = filters.sortOrder === 'desc' ? 'DESC' : 'ASC';
    query += ` ORDER BY c.${sortBy} ${sortOrder}`;
    
    // Pagination
    const page = parseInt(filters.page || 1);
    const limit = parseInt(filters.limit || 20);
    const offset = (page - 1) * limit;
    
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    return db.query(query, params);
  }

  static async countSearch(filters) {
    let query = `
      SELECT COUNT(DISTINCT c.id) as total
      FROM categories c
      LEFT JOIN sites s ON c.site_id = s.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (filters.search) {
      query += ` AND c.name ILIKE $${paramIndex}`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }
    
    if (filters.site_id) {
      query += ` AND c.site_id = $${paramIndex}`;
      params.push(filters.site_id);
      paramIndex++;
    }
    
    const result = await db.query(query, params);
    return parseInt(result.rows[0].total);
  }

  // Recherche par nom (auto-complétion)
  static async autocomplete(searchTerm, limit = 10) {
    const query = `
      SELECT id, name, description, site_id
      FROM categories
      WHERE name ILIKE $1
      ORDER BY name
      LIMIT $2
    `;
    return db.query(query, [`%${searchTerm}%`, limit]);
  }



}


module.exports = CategoryRepository;