
// Importation des modules nécessaires
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../config/database');
const Role = require('../roles/RoleModel');

/**
 * Modèle User
 */
class User {
  constructor({
    id,
    email,
    first_name,
    last_name,
    role,
    active,
    created_at,
    last_login,
    site
  }) {
    this.id = id;
    this.email = email;
    this.firstName = first_name;
    this.lastName = last_name;
    this.role = role; // objet Role
    this.active = active;
    this.createdAt = created_at;
    this.lastLogin = last_login;
    this.site = site; // objet Site
  }
}

module.exports = User;