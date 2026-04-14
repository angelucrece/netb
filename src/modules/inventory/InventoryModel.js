class Inventory {
  constructor({
    id,
    product_id,
    site_id,
    system_quantity,
    real_quantity,
    difference,
    user_id,
    created_at
  }) {
    this.id = id;
    this.productId = product_id;
    this.siteId = site_id;
    this.systemQuantity = system_quantity;
    this.realQuantity = real_quantity;
    this.difference = difference;
    this.userId = user_id;
    this.createdAt = created_at;
  }
}

module.exports = Inventory;