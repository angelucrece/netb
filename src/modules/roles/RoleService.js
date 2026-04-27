const RoleRepository = require('./RoleRepository');
const ApiError = require('../../utils/ApiError');

class RoleService {
  static async getRoles() {
    return await RoleRepository.findAll();
  }

  static async getRoleById(id) {
    const role = await RoleRepository.findById(id);
    if (!role) throw ApiError.notFound('Rôle introuvable');
    return role;
  }
}

module.exports = RoleService;
