/**
 * InventoryModel — fabrique d'objet inventaire (plain object).
 * Remplace la classe avec constructeur unique (SonarCloud S2094).
 */
const createInventory = ({
  id, product_id, site_id, system_quantity,
  real_quantity, difference, user_id, created_at
}) => ({
  id,
  productId:      product_id,
  siteId:         site_id,
  systemQuantity: system_quantity,
  realQuantity:   real_quantity,
  difference,
  userId:         user_id,
  createdAt:      created_at,
});

module.exports = createInventory;