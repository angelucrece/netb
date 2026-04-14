// modules/roles/RoleModel.js
// Description : Modèle représentant la table "roles" (DB only)
// class Role {
//   // ===== Déclaration des attributs =====
//   _id;
//   _name;       // ex: admin, user
//   _description;
//   _created_at;

//   // ===== Constructeur =====
//   constructor({ id, name, description, created_at }) {
//     this._id = id;
//     this._name = name;
//     this._description = description;
//     this._created_at = created_at;
//   }

//   // ===== Getters =====
//   get id() {
//     return this._id;
//   }

//   get name() {
//     return this._name;
//   }

//   get description() {
//     return this._description;
//   }

//   get createdAt() {
//     return this._created_at;
//   }

//   // ===== Setters =====
//   set name(value) {
//     this._name = value;
//   }

//   set description(value) {
//     this._description = value;
//   }
// }

// module.exports = Role;

/**
 * Modèle Role
 * Représente un rôle utilisateur (admin, magasinier, etc.)
 */
class Role {
  constructor({ id, name, description, created_at }) {
    this.id = id; // identifiant du rôle
    this.name = name; // nom du rôle (admin, magasinier)
    this.description = description; // description du rôle
    this.createdAt = created_at; // date de création
    this.updatedAt = created_at; // date de dernière mise à jour (initialement égale à created_at)
  }
}

module.exports = Role;