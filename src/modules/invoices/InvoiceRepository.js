const db = require('../../config/database');

const runner = (client) => client || db;

class InvoiceRepository {
  // Cette fonction liste les factures avec filtres et pagination.
  static async findAll({ status, client_id, sale_order_id, date_from, date_to, limit, offset }) {
    const conds = [];
    const vals = [];
    let i = 1;

    if (status) { conds.push(`i.status = $${i++}`); vals.push(status); }
    if (client_id) { conds.push(`i.client_id = $${i++}`); vals.push(client_id); }
    if (sale_order_id) { conds.push(`i.sale_order_id = $${i++}`); vals.push(sale_order_id); }
    if (date_from) { conds.push(`i.created_at >= $${i++}`); vals.push(date_from); }
    if (date_to) { conds.push(`i.created_at <= $${i++}`); vals.push(date_to); }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await db.query(
      `SELECT i.*, c.name AS client_name, so.reference AS sale_reference
       FROM invoices i
       LEFT JOIN clients c ON c.id = i.client_id
       JOIN sale_orders so ON so.id = i.sale_order_id
       ${where}
       ORDER BY i.created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...vals, limit, offset]
    );
    return rows;
  }

  // Cette fonction compte les factures pour la pagination.
  static async count({ status, client_id, sale_order_id, date_from, date_to }) {
    const conds = [];
    const vals = [];
    let i = 1;

    if (status) { conds.push(`status = $${i++}`); vals.push(status); }
    if (client_id) { conds.push(`client_id = $${i++}`); vals.push(client_id); }
    if (sale_order_id) { conds.push(`sale_order_id = $${i++}`); vals.push(sale_order_id); }
    if (date_from) { conds.push(`created_at >= $${i++}`); vals.push(date_from); }
    if (date_to) { conds.push(`created_at <= $${i++}`); vals.push(date_to); }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await db.query(`SELECT COUNT(*) FROM invoices ${where}`, vals);
    return parseInt(rows[0].count, 10);
  }

  // Cette fonction retrouve la derniere facture liee a une vente.
  static async findBySaleOrder(sale_order_id) {
    const { rows } = await db.query(
      'SELECT * FROM invoices WHERE sale_order_id=$1 ORDER BY created_at DESC LIMIT 1',
      [sale_order_id]
    );
    return rows[0] || null;
  }

  // Cette fonction recupere une facture et quelques infos de sa vente.
  static async findById(id) {
    const { rows } = await db.query(
      `SELECT i.*, so.site_id, so.status AS sale_status, so.payment_status AS sale_payment_status
       FROM invoices i
       JOIN sale_orders so ON so.id = i.sale_order_id
       WHERE i.id=$1`,
      [id]
    );
    return rows[0] || null;
  }

  // Cette fonction cree une facture a partir des montants de la vente.
  static async create(order, reference, dueDate, userId, client) {
    const { rows } = await runner(client).query(
      `INSERT INTO invoices
        (sale_order_id, client_id, reference, due_date, subtotal, discount_amount,
         delivery_fee, total_amount, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id`,
      [
        order.id,
        order.client_id || null,
        reference,
        dueDate || null,
        order.subtotal || 0,
        order.discount_amount || 0,
        order.delivery_fee || 0,
        order.total_amount || 0,
        userId || null,
      ]
    );
    return rows[0].id;
  }

  // Cette fonction met a jour les montants payes et le statut de la facture.
  static async updatePayment(invoice_id, paidAmount, status, client) {
    await runner(client).query(
      'UPDATE invoices SET paid_amount=$1, status=$2, updated_at=NOW() WHERE id=$3',
      [paidAmount, status, invoice_id]
    );
  }
}

module.exports = InvoiceRepository;
