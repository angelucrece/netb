const CategoryRepository = require('./CategoryRepository');
const ApiError  = require('../../utils/ApiError');
const paginate  = require('../../utils/paginate');
const { logAction } = require('../../utils/auditLog');

class CategoryService {

  static async getAll(filters) {
    const { page = 1, limit = 20, ...rest } = filters;
    const pg = paginate(page, limit, 0);
    const [rows, total] = await Promise.all([
      CategoryRepository.findAll({ ...rest, limit: pg.limit, offset: pg.offset }),
      CategoryRepository.count(rest),
    ]);
    return { categories: rows, pagination: paginate(page, limit, total) };
  }

  static async getById(id) {
    const cat = await CategoryRepository.findById(id);
    if (!cat) throw ApiError.notFound('Catégorie introuvable');
    return cat;
  }

  static async create(data, userId, ip) {
    const dup = await CategoryRepository.findByName(data.name);
    if (dup) throw ApiError.conflict('Nom de catégorie déjà utilisé');
    const cat = await CategoryRepository.create(data);
    await logAction({ userId, action: 'CREATE_CATEGORY', entityType: 'category', entityId: cat.id, newValue: data, ip });
    return cat;
  }

  static async update(id, data, userId, ip) {
    await this.getById(id);
    const dup = await CategoryRepository.findByName(data.name, id);
    if (dup) throw ApiError.conflict('Nom de catégorie déjà utilisé');
    const cat = await CategoryRepository.update(id, data);
    await logAction({ userId, action: 'UPDATE_CATEGORY', entityType: 'category', entityId: id, newValue: data, ip });
    return cat;
  }

  static async delete(id, userId, ip) {
    await this.getById(id);
    const hasProducts = await CategoryRepository.hasProducts(id);
    if (hasProducts) throw ApiError.conflict('Impossible de supprimer une catégorie contenant des produits');
    await CategoryRepository.softDelete(id);
    await logAction({ userId, action: 'DELETE_CATEGORY', entityType: 'category', entityId: id, ip });
  }
}

module.exports = CategoryService;
