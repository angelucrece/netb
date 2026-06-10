/**
 * StockDocumentModel — fabrique d'objet document de stock (plain object).
 * Remplace la classe avec constructeur unique (SonarCloud S2094).
 */
const createStockDocument = ({
  id, type, site_id, destination_site_id, status, user_id, created_at
}) => ({
  id,
  type,
  siteId:             site_id,
  destinationSiteId:  destination_site_id,
  status,
  userId:             user_id,
  createdAt:          created_at,
});

module.exports = createStockDocument;