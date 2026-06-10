/**
 * UserModel — fabrique d'objet utilisateur (plain object).
 * Remplace la classe avec constructeur unique (SonarCloud S2094).
 * Suppression des imports Sequelize inutilisés.
 */
const createUser = ({
  id, email, first_name, last_name,
  role, active, created_at, last_login, site
}) => ({
  id,
  email,
  firstName:  first_name,
  lastName:   last_name,
  role,
  active,
  createdAt:  created_at,
  lastLogin:  last_login,
  site,
});

module.exports = createUser;