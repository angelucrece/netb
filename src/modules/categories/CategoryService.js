// Description : Logique métier pour les catégories
// Journalisation via logger à chaque action

const logger = require('../../config/logger');
const CategoryRepository = require('./CategoryRepository');

class CategoryService {

  static async getAll(adminId) {
    const id = adminId || 'unknown';
    logger.info('Récupération toutes les catégories', { adminId: id });
    const result = await CategoryRepository.findAll();
    logger.debug('Catégories récupérées', { count: result.rows.length });
    return result.rows;
  }

  static async getById(id, adminId) {
    const aid = adminId || 'unknown';
    logger.info('Récupération catégorie', { categoryId: id, adminId: aid });
    const result = await CategoryRepository.findById(id);
    if (result.rows.length === 0) return null;
    return result.rows[0];
  }

  static async createCategory(client, name, description, site_id, userId) {
    logger.info('Création catégorie', { name, userId });
    const existing = await CategoryRepository.findByName(name);
    if (existing.rows.length > 0) throw new Error('Nom catégorie déjà existant');

    const result = await CategoryRepository.create(client, name, description, site_id);

    await client.query(
      'INSERT INTO logs (user_id, action, details) VALUES ($1, $2, $3)',
      [userId, 'CREATE_CATEGORY', JSON.stringify({ categoryId: result.rows[0].id, name })]
    );

    logger.info('Catégorie créée', { categoryId: result.rows[0].id, userId });
    return result.rows[0];
  }

  static async updateCategory(client, id, name, description, site_id, oldCategory, userId) {
    logger.info('Modification catégorie', { categoryId: id, userId });

    const nameCheck = await CategoryRepository.findByName(name);
    if (nameCheck.rows.some(r => r.id !== parseInt(id))) throw new Error('Nom catégorie déjà existant');

    const updated = await CategoryRepository.update(client, id, name, description, site_id);

    const changes = {};
    if (oldCategory.name !== name) changes.name = { old: oldCategory.name, new: name };
    if (oldCategory.description !== description) changes.description = { old: oldCategory.description, new: description };
    if (oldCategory.site_id !== site_id) changes.site_id = { old: oldCategory.site_id, new: site_id };

    await client.query(
      'INSERT INTO logs (user_id, action, details) VALUES ($1, $2, $3)',
      [userId, 'UPDATE_CATEGORY', JSON.stringify({ categoryId: id, changes })]
    );

    logger.info('Catégorie modifiée', { categoryId: id, userId });
    return updated.rows[0];
  }

  static async deleteCategory(client, id, name, userId) {
    logger.info('Suppression catégorie', { categoryId: id, userId });

    const productCount = await CategoryRepository.countProducts(id);
    if (productCount > 0) throw new Error(`Impossible de supprimer, ${productCount} produit(s) l'utilisent`);

    await CategoryRepository.delete(client, id);

    await client.query(
      'INSERT INTO logs (user_id, action, details) VALUES ($1, $2, $3)',
      [userId, 'DELETE_CATEGORY', JSON.stringify({ categoryId: id, name })]
    );

    logger.info('Catégorie supprimée', { categoryId: id, name, userId });
    return true;
  }



  // Recherche avancée
  static async searchCategories(filters, userId) {
    logger.info('Recherche catégories', { filters, userId });
    
    const [data, total] = await Promise.all([
      CategoryRepository.search(filters),
      CategoryRepository.countSearch(filters)
    ]);
    
    const page = parseInt(filters.page || 1);
    const limit = parseInt(filters.limit || 20);
    
    return {
      categories: data.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Auto-complétion
  static async autocomplete(searchTerm, limit = 10, userId) {
    logger.info('Auto-complétion catégories', { searchTerm, userId });
    
    const result = await CategoryRepository.autocomplete(searchTerm, limit);
    
    return result.rows.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      site_id: c.site_id
    }));
  }


}

module.exports = CategoryService;