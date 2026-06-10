const db = require('../../config/database');

const runner = (client) => client || db;

class DeliveryRepository {
  // Cette fonction liste les bons de livraison avec filtres et pagination.
  static async findAll({ status, sale_order_id, date_from, date_to, limit, offset }) {
    const conds = [];
    const vals = [];
    let i = 1;

    if (status) { conds.push(`d.status = $${i++}`); vals.push(status); }
    if (sale_order_id) { conds.push(`d.sale_order_id = $${i++}`); vals.push(sale_order_id); }
    if (date_from) { conds.push(`d.created_at >= $${i++}`); vals.push(date_from); }
    if (date_to) { conds.push(`d.created_at <= $${i++}`); vals.push(date_to); }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await db.query(
      `SELECT d.*, so.reference AS sale_reference, so.client_name
       FROM deliveries d
       JOIN sale_orders so ON so.id = d.sale_order_id
       ${where}
       ORDER BY d.created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...vals, limit, offset]
    );
    return rows;
  }

  // Cette fonction compte les livraisons pour construire la pagination.
  static async count({ status, sale_order_id, date_from, date_to }) {
    const conds = [];
    const vals = [];
    let i = 1;

    if (status) { conds.push(`status = $${i++}`); vals.push(status); }
    if (sale_order_id) { conds.push(`sale_order_id = $${i++}`); vals.push(sale_order_id); }
    if (date_from) { conds.push(`created_at >= $${i++}`); vals.push(date_from); }
    if (date_to) { conds.push(`created_at <= $${i++}`); vals.push(date_to); }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await db.query(`SELECT COUNT(*) FROM deliveries ${where}`, vals);
    return Number.parseInt(rows[0].count, 10);
  }

  // Cette fonction recupere un bon de livraison precis avec l'etat de sa vente.
  static async findById(id) {
    const { rows } = await db.query(
      `SELECT d.*, so.site_id, so.status AS sale_status
       FROM deliveries d
       JOIN sale_orders so ON so.id = d.sale_order_id
       WHERE d.id=$1`,
      [id]
    );
    return rows[0] || null;
  }

  // Cette fonction cree le bon de livraison rattache a une commande client.
  static async create(saleOrder, data, userId, client) {
    const { rows } = await runner(client).query(
      `INSERT INTO deliveries
        (sale_order_id, reference, delivery_address, delivery_fee, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id`,
      [
        saleOrder.id,
        data.reference || saleOrder.reference || `BL-${saleOrder.id}`,
        data.delivery_address || saleOrder.delivery_address || null,
        data.delivery_fee ?? saleOrder.delivery_fee ?? 0,
        data.notes || null,
        userId || null,
      ]
    );
    return rows[0].id;
  }

  // Cette fonction change l'etat du bon de livraison: pending, in_transit ou delivered.
  static async setStatus(id, status, userId, client) {
    await runner(client).query(
      `UPDATE deliveries SET status=$1,
         delivered_by = CASE WHEN $1='delivered' THEN $2 ELSE delivered_by END,
         delivered_at = CASE WHEN $1='delivered' THEN NOW() ELSE delivered_at END,
         updated_at=NOW()
       WHERE id=$3`,
      [status, userId || null, id]
    );
  }
}

module.exports = DeliveryRepository;
