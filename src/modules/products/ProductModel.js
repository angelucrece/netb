
// Représentation d’un produit

// class Product {
//   constructor(data) {
//     this._id = data.id;
//     this._name = data.name;
//     this._barcode = data.barcode;
//     this._price = data.price;
//     this._quantity = data.quantity;
//     this._threshold = data.threshold;
//     this._categoryId = data.category_id;
//     this._description = data.description;
//     this._createdAt = data.created_at;
//     this._updatedAt = data.updated_at;
//   }

//   get id() { return this._id; }
//   get name() { return this._name; }
// }

// module.exports = Product;
// class Product {
//   constructor({ id, name, barcode, price, quantity, threshold, category, description, created_at, updated_at }) {
//     this._id = id;
//     this._name = name;
//     this._barcode = barcode;
//     this._price = price;
//     this._quantity = quantity;
//     this._threshold = threshold;
//     this._category = category;
//     this._description = description;
//     this._createdAt = created_at;
//     this._updatedAt = updated_at || created_at;
//   }

//   // ===== Getters =====
//   get id() {
//     return this._id;
//   }

//   get name() {
//     return this._name;
//   }

//   get barcode() {
//     return this._barcode;
//   }

//   get price() {
//     return this._price;
//   }

//   get quantity() {
//     return this._quantity;
//   }

//   get threshold() {
//     return this._threshold;
//   }

//   get categoryId() {
//     return this._categoryId;
//   }

//   get description() {
//     return this._description;
//   }

//   get createdAt() {
//     return this._createdAt;
//   }

//   get updatedAt() {
//     return this._updatedAt;
//   }

//   // ===== Setters =====
//   set name(value) {
//     this._name = value;
//   }

//   set barcode(value) {
//     this._barcode = value;
//   }

//   set price(value) {
//     this._price = value;
//   }

//   set quantity(value) {
//     this._quantity = value;
//   }

//   set threshold(value) {
//     this._threshold = value;
//   }

//   set categoryId(value) {
//     this._categoryId = value;
//   }

//   set description(value) {
//     this._description = value;
//   }
// }


class Product {
  constructor({ 
    id, 
    name, 
    barcode, 
    selling_price, 
    purchase_price, 
    threshold, 
    category, 
    description, 
    photo,
    active,
    created_at, 
    updated_at 
  }) {
    this._id = id;
    this._name = name;
    this._barcode = barcode;
    this._selling_price = parseFloat(selling_price) || 0;
    this._purchase_price = parseFloat(purchase_price) || 0;
    this._threshold = parseInt(threshold) || 10;
    this._category = category;
    this._description = description;
    this._photo = photo;
    this._active = active !== undefined ? active : true;
    this._createdAt = created_at;
    this._updatedAt = updated_at || created_at;
    this._margin = this.calculateMargin();
  }

  // Calcul de la marge bénéficiaire
  calculateMargin() {
    if (this._purchase_price > 0) {
      return ((this._selling_price - this._purchase_price) / this._purchase_price * 100).toFixed(2);
    }
    return 0;
  }

  // Getters
  get id() { return this._id; }
  get name() { return this._name; }
  get barcode() { return this._barcode; }
  get selling_price() { return this._selling_price; }
  get purchase_price() { return this._purchase_price; }
  get threshold() { return this._threshold; }
  get category() { return this._category; }
  get description() { return this._description; }
  get photo() { return this._photo; }
  get active() { return this._active; }
  get createdAt() { return this._createdAt; }
  get updatedAt() { return this._updatedAt; }
  get margin() { return this._margin; }
  get lowStock() { return this._threshold; }

  //setters
  set name(value) {  this._name = value ; }
  set barcode(value) {  this._barcode = value; }
  set selling_price(value) { this._selling_price = value; }
  set purchase_price(value) { this._purchase_price = value; }
  set threshold(value) { this._threshold = value; }
  set category(value) {this._category = value; }
  set description(value) { this._description = value; }
  set photo(value) { this._photo = value; }
  

  // Méthodes
  toJSON() {
    return {
      id: this._id,
      name: this._name,
      barcode: this._barcode,
      selling_price: this._selling_price,
      purchase_price: this._purchase_price,
      threshold: this._threshold,
      category: this._category,
      description: this._description,
      photo: this._photo,
      active: this._active,
      margin: this._margin,
      low_stock: this.lowStock,
      created_at: this._createdAt,
      updated_at: this._updatedAt
    };
  }
}

module.exports = Product;
