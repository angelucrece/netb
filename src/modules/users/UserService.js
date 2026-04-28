const bcrypt     = require('bcryptjs');
const UserRepository = require('./UserRepository');
const ApiError   = require('../../utils/ApiError');
const paginate   = require('../../utils/paginate');
const { logAction } = require('../../utils/auditLog');

class UserService {

  static async getUsers(filters) {
    const { page = 1, limit = 20, ...rest } = filters;
    const pg = paginate(page, limit, 0);
    const [rows, total] = await Promise.all([
      UserRepository.findAll({ ...rest, limit: pg.limit, offset: pg.offset }),
      UserRepository.count(rest),
    ]);
    return { users: rows, pagination: paginate(page, limit, total) };
  }

  static async getUserById(id) {
    const user = await UserRepository.findById(id);
    if (!user) throw ApiError.notFound('Utilisateur introuvable');
    return user;
  }

  static async createUser(data, adminId, ip) {
    const { email, password, first_name, last_name, role_id, site_id } = data;

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

  static async updateUser(id, data, adminId, ip) {
    const old = await this.getUserById(id);
    const updated = await UserRepository.update(id, data);
    if (!updated) throw ApiError.notFound('Utilisateur introuvable');
    await logAction({ userId: adminId, action: 'UPDATE_USER', entityType: 'user',
                      entityId: id, oldValue: old, newValue: data, ip });
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

  static async toggleUser(id, active, adminId) {
    await this.getUserById(id);
    if (id === adminId) throw ApiError.badRequest('Vous ne pouvez pas modifier votre propre statut');
    return await UserRepository.toggle(id, active);
  }

  static async deleteUser(id, adminId) {
    await this.getUserById(id);
    if (id === adminId) throw ApiError.badRequest('Vous ne pouvez pas supprimer votre propre compte');
    await UserRepository.softDelete(id);
  }
}

module.exports = UserService;
