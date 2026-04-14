class StockDocument {
  constructor({
    id,
    type,
    site_id,
    destination_site_id,
    status,
    user_id,
    created_at
  }) {
    this.id = id;
    this.type = type;
    this.siteId = site_id;
    this.destinationSiteId = destination_site_id;
    this.status = status;
    this.userId = user_id;
    this.createdAt = created_at;
  }
}

module.exports = StockDocument;