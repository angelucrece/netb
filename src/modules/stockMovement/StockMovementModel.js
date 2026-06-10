/**
 * StockMovementModel — fabrique d'objet mouvement de stock (plain object).
 * Remplace la classe avec constructeur unique (SonarCloud S2094).
 */
const createStockMovement = ({
  id, product_id, site_id, type, quantity,
  user_id, reason, reference_id, created_at
}) => ({
  id,
  productId:   product_id,
  siteId:      site_id,
  type,
  quantity,
  userId:      user_id,
  reason,
  referenceId: reference_id,
  createdAt:   created_at,
});

module.exports = createStockMovement;