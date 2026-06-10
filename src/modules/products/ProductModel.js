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
    this._id             = id;
    this._name           = name;
    this._barcode        = barcode;
    this._selling_price  = Number.parseFloat(selling_price)  || 0;
    this._purchase_price = Number.parseFloat(purchase_price) || 0;
    this._threshold      = Number.parseInt(threshold, 10)    || 10;
    this._category       = category;
    this._description    = description;
    this._photo          = photo;
    // active !== undefined évitait un false positif — simplifié avec ?? (SonarCloud S2589)
    this._active         = active ?? true;
    this._createdAt      = created_at;
    this._updatedAt      = updated_at || created_at;
    this._margin         = this.calculateMargin();
  }

  // Calcul de la marge bénéficiaire
  // Retourne toujours un Number (cohérence de type — SonarCloud S3800)
  calculateMargin() {
    if (this._purchase_price > 0) {
      return Number(
        ((this._selling_price - this._purchase_price) / this._purchase_price * 100).toFixed(2)
      );
    }
    return 0;
  }

  // Getters
  get id()             { return this._id; }
  get name()           { return this._name; }
  get barcode()        { return this._barcode; }
  get selling_price()  { return this._selling_price; }
  get purchase_price() { return this._purchase_price; }
  get threshold()      { return this._threshold; }
  get category()       { return this._category; }
  get description()    { return this._description; }
  get photo()          { return this._photo; }
  get active()         { return this._active; }
  get createdAt()      { return this._createdAt; }
  get updatedAt()      { return this._updatedAt; }
  get margin()         { return this._margin; }
  get lowStock()       { return this._threshold; }

  // Setters
  set name(value)           { this._name = value; }
  set barcode(value)        { this._barcode = value; }
  set selling_price(value)  { this._selling_price = value; }
  set purchase_price(value) { this._purchase_price = value; }
  set threshold(value)      { this._threshold = value; }
  set category(value)       { this._category = value; }
  set description(value)    { this._description = value; }
  set photo(value)          { this._photo = value; }

  toJSON() {
    return {
      id:             this._id,
      name:           this._name,
      barcode:        this._barcode,
      selling_price:  this._selling_price,
      purchase_price: this._purchase_price,
      threshold:      this._threshold,
      category:       this._category,
      description:    this._description,
      photo:          this._photo,
      active:         this._active,
      margin:         this._margin,
      low_stock:      this.lowStock,
      created_at:     this._createdAt,
      updated_at:     this._updatedAt,
    };
  }
}

module.exports = Product;