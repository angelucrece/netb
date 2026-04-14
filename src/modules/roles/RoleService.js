// modules/roles/role.service.js
// Description : Service pour gérer la logique métier des rôles

// const RoleRepository = require('./RoleRepository');

// class RoleService {
//   // Récupérer tous les rôles
//   static async getAllRoles() {
//     return await RoleRepository.findAll();
//   }

//   // Récupérer un rôle par ID
//   static async getRoleById(id) {
//     const role = await RoleRepository.findById(id);
//     if (!role) throw new Error('Role not found');
//     return role;
//   }

//   // Créer un nouveau rôle avec validation simple
//   static async createRole({ name, description }) {
//     if (!name || !name.trim()) {
//       throw new Error('Le nom du rôle est obligatoire');
//     }

//     // Vérifier qu’un rôle avec le même nom n’existe pas
//     const existingRole = await RoleRepository.findByName(name);
//     if (existingRole) {
//       throw new Error('Un rôle avec ce nom existe déjà');
//     }

//     return await RoleRepository.create({ name, description });
//   }

//   // Mettre à jour un rôle
//   static async updateRole(id, fields) {
//     return await RoleRepository.update(id, fields);
//   }

//   // Supprimer un rôle
//   static async deleteRole(id) {
//     return await RoleRepository.delete(id);
//   }
// }

// module.exports = RoleService;

const RoleRepository = require('./RoleRepository');
const Role = require('./RoleModel');

/**
 * Service = logique métier
 * Transforme les données et applique des règles
 */
class RoleService {

  // Retourne tous les rôles
  static async getRoles() {
    const roles = await RoleRepository.findAll();

    // Transformation en objets Role
    return roles.map(role => new Role(role));
  }

  // Retourne un rôle spécifique
  static async getRoleById(id) {
    const role = await RoleRepository.findById(id);

    if (!role) {
      throw new Error('ROLE_NOT_FOUND');
    }

    return new Role(role);
  }

    // Créer un nouveau rôle
  static async createRole(data) {
    const newRole = await RoleRepository.create(data);
    return new Role(newRole);
  }

  // Mettre à jour un rôle existant
  static async updateRole(id, data) {
    const updatedRole = await RoleRepository.update(id, data);
    return new Role(updatedRole);
  }

  // Supprimer un rôle
  static async deleteRole(id) {
    await RoleRepository.delete(id);
    return true;
  }
}

module.exports = RoleService;