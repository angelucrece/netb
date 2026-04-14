class StockMovement {
  constructor({
    id,
    product_id,
    site_id,
    type,
    quantity,
    user_id,
    reason,
    reference_id,
    created_at
  }) {
    this.id = id;
    this.productId = product_id;
    this.siteId = site_id;
    this.type = type;
    this.quantity = quantity;
    this.userId = user_id;
    this.reason = reason;
    this.referenceId = reference_id; // pour transfert ou autre
    this.createdAt = created_at;
  }
}

module.exports = StockMovement;