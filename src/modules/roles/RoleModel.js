/**
 * RoleModel — fabrique d'objet rôle (plain object).
 * Remplace la classe avec constructeur unique (SonarCloud S2094).
 * Code commenté supprimé (SonarCloud S125).
 */
const createRole = ({ id, name, label, description, created_at }) => ({
  id,
  name,
  label,
  description,
  createdAt:  created_at,
  updatedAt:  created_at,
});

module.exports = createRole;