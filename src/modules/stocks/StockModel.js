/**
 * Représente le stock d’un produit dans un site donné
 */
// StockModel.js
// ===== Modèle représentant un stock d'un produit dans un site =====
class Stock {
  constructor({ id, product_id, site_id, quantity, threshold, created_at, updated_at }) {
    this._id = id;
    this._product_id = product_id;
    this._site_id = site_id;
    this._quantity = quantity;
    this._threshold = threshold;
    this._createdAt = created_at;
    this._updatedAt = updated_at || created_at;
  }

  // ===== Getters =====
  get id() { return this._id; }
  get product_id() { return this._product_id; }
  get site_id() { return this._site_id; }
  get quantity() { return this._quantity; }
  get threshold() { return this._threshold; }

  isLowStock() {
    return this._quantity <= this._threshold;
  }

  // ===== Setters =====
  set quantity(value) { this._quantity = value; }
  set threshold(value) { this._threshold = value; }
}

module.exports = Stock;