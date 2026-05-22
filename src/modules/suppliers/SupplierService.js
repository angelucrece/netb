const SupplierRepository = require('./SupplierRepository');
const ApiError = require('../../utils/ApiError');
const paginate = require('../../utils/paginate');
const { logAction } = require('../../utils/auditLog');

class SupplierService {
  static async getAll(filters) {
    const { page = 1, limit = 20, ...rest } = filters;
    const pg = paginate(page, limit, 0);
    const [rows, total] = await Promise.all([
      SupplierRepository.findAll({ ...rest, limit: pg.limit, offset: pg.offset }),
      SupplierRepository.count(rest),
    ]);
    return { suppliers: rows, pagination: paginate(page, limit, total) };
  }

  static async getById(id) {
    const supplier = await SupplierRepository.findById(id);
    if (!supplier) throw ApiError.notFound('Fournisseur introuvable');
    return supplier;
  }

  static async create(data, userId, ip) {
    const supplier = await SupplierRepository.create(data);
    await logAction({ userId, action: 'CREATE_SUPPLIER', entityType: 'supplier', entityId: supplier.id, newValue: supplier, ip });
    return supplier;
  }

  static async update(id, data, userId, ip) {
    const old = await this.getById(id);
    const supplier = await SupplierRepository.update(id, data);
    await logAction({ userId, action: 'UPDATE_SUPPLIER', entityType: 'supplier', entityId: id, oldValue: old, newValue: supplier, ip });
    return supplier;
  }

  static async toggle(id, active, userId, ip) {
    await this.getById(id);
    const supplier = await SupplierRepository.setActive(id, active);
    await logAction({ userId, action: 'TOGGLE_SUPPLIER', entityType: 'supplier', entityId: id, newValue: { active }, ip });
    return supplier;
  }

  static async delete(id, userId, ip) {
    await this.toggle(id, false, userId, ip);
  }
}

module.exports = SupplierService;
