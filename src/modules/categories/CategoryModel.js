
/**
 * Modèle Role
 * Représente un rôle utilisateur (admin, magasinier, etc.)
 */
// Description : Modèle Category
// Représente une catégorie de produit dans le système

class Category{
    constructor({ id, name, description, created_at, updated_at, site }) {
        this._id = id;
        this._name = name;
        this._description = description;
        this._createdAt = created_at;
        this._updatedAt = updated_at || created_at;
        this._site = site; // objet Site
    }

    
  // ===== Getters =====
  get id() {
    return this._id;
  }

  get name() {
    return this._name;
  }

  get description() {
    return this._description;
  }

  get createdAt() {
    return this._created_at;
  }
    get updatedAt() {
    return this._updatedAt;
  }

   // Méthode métier
  isGlobal() { return this._site == null; }
  // ===== Setters =====
  set name(value) {
    this._name = value;
  }

  set description(value) {
    this._description = value;
  }
}
module.exports = Category;