const bcrypt     = require('bcryptjs');
const UserRepository = require('./UserRepository');
const RoleRepository = require('../roles/RoleRepository');
const ApiError   = require('../../utils/ApiError');
const paginate   = require('../../utils/paginate');
const { logAction } = require('../../utils/auditLog');
const { assertSiteAccess, scopeFiltersToUser, scopePayloadToUser, isSuperAdmin } = require('../../utils/accessControl');

const assertAssignableRole = async (roleId, requester) => {
  if (!requester || isSuperAdmin(requester)) return;
  const role = await RoleRepository.findById(roleId);
  if (!role) throw ApiError.notFound('Rôle introuvable');
  if (['admin', 'superadmin'].includes(role.name)) {
    throw ApiError.forbidden('Un admin agence ne peut pas attribuer un rôle global');
  }
};

class UserService {

  static async getUsers(filters, requester) {
    const { page = 1, limit = 20, ...rest } = filters;
    const scoped = requester?.role ? scopeFiltersToUser(rest, requester) : rest;
    const pg = paginate(page, limit, 0);
    const [rows, total] = await Promise.all([
      UserRepository.findAll({ ...scoped, limit: pg.limit, offset: pg.offset }),
      UserRepository.count(scoped),
    ]);
    return { users: rows, pagination: paginate(page, limit, total) };
  }

  static async getUserById(id, requester) {
    const user = await UserRepository.findById(id);
    if (!user) throw ApiError.notFound('Utilisateur introuvable');
    if (requester?.role && requester.id !== id) assertSiteAccess(requester, user.site_id);
    return user;
  }

  static async createUser(data, admin, ip) {
    const adminId = typeof admin === 'object' ? admin.id : admin;
    const scopedData = typeof admin === 'object' ? scopePayloadToUser(data, admin) : data;
    const { email, password, first_name, last_name, role_id, site_id } = scopedData;
    await assertAssignableRole(role_id, typeof admin === 'object' ? admin : null);

    const exists = await UserRepository.findByEmail(email.toLowerCase());
    if (exists) throw ApiError.conflict('Email déjà utilisé');

    const password_hash = await bcrypt.hash(password, 12);
    const user = await UserRepository.create({
      email: email.toLowerCase(), password_hash, first_name, last_name, role_id, site_id,
    });

    await logAction({ userId: adminId, action: 'CREATE_USER', entityType: 'user',
                      entityId: user.id, newValue: { email }, ip });
    return user;
  }

  static async updateUser(id, data, admin, ip) {
    const adminId = typeof admin === 'object' ? admin.id : admin;
    const old = await this.getUserById(id, typeof admin === 'object' ? admin : null);
    const scopedData = typeof admin === 'object' ? scopePayloadToUser(data, admin) : data;
    await assertAssignableRole(scopedData.role_id, typeof admin === 'object' ? admin : null);
    const updated = await UserRepository.update(id, scopedData);
    if (!updated) throw ApiError.notFound('Utilisateur introuvable');
    await logAction({ userId: adminId, action: 'UPDATE_USER', entityType: 'user',
                      entityId: id, oldValue: old, newValue: scopedData, ip });
    return updated;
  }

  static async changePassword(id, { old_password, new_password }) {
    const { rows } = await require('../../config/database').query(
      'SELECT password_hash FROM users WHERE id=$1', [id]
    );
    if (!rows.length) throw ApiError.notFound('Utilisateur introuvable');

    const ok = await bcrypt.compare(old_password, rows[0].password_hash);
    if (!ok) throw ApiError.badRequest('Ancien mot de passe incorrect');

    const hash = await bcrypt.hash(new_password, 12);
    await UserRepository.updatePassword(id, hash);
  }

  static async toggleUser(id, active, admin) {
    const adminId = typeof admin === 'object' ? admin.id : admin;
    await this.getUserById(id, typeof admin === 'object' ? admin : null);
    if (id === adminId) throw ApiError.badRequest('Vous ne pouvez pas modifier votre propre statut');
    return await UserRepository.toggle(id, active);
  }

  static async deleteUser(id, admin) {
    const adminId = typeof admin === 'object' ? admin.id : admin;
    await this.getUserById(id, typeof admin === 'object' ? admin : null);
    if (id === adminId) throw ApiError.badRequest('Vous ne pouvez pas supprimer votre propre compte');
    await UserRepository.softDelete(id);
  }
}

module.exports = UserService;
