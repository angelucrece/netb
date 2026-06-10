const db = require('../../config/database');

const runner = (client) => client || db;

class SaleRepository {
  static _filters({ client_id, site_id, status, payment_status, channel, date_from, date_to, search }) {
    const conds = [];
    const vals = [];
    let i = 1;

    if (client_id) { conds.push(`so.client_id = $${i++}`); vals.push(client_id); }
    if (site_id) { conds.push(`so.site_id = $${i++}`); vals.push(site_id); }
    if (status) { conds.push(`so.status = $${i++}`); vals.push(status); }
    if (payment_status) { conds.push(`so.payment_status = $${i++}`); vals.push(payment_status); }
    if (channel) { conds.push(`so.channel = $${i++}`); vals.push(channel); }
    if (date_from) { conds.push(`so.created_at >= $${i++}`); vals.push(date_from); }
    if (date_to) { conds.push(`so.created_at <= $${i++}`); vals.push(date_to); }
    if (search) {
      conds.push(`(so.reference ILIKE $${i} OR so.client_name ILIKE $${i} OR c.name ILIKE $${i})`);
      vals.push(`%${search}%`);
      i++;
    }

    return { where: conds.length ? `WHERE ${conds.join(' AND ')}` : '', vals, i };
  }

  static async findAll(filters) {
    const { limit, offset, ...rest } = filters;
    const { where, vals, i } = this._filters(rest);
    const { rows } = await db.query(
      `SELECT so.*, c.name AS client_registered_name, s.name AS site_name,
              u.first_name || ' ' || u.last_name AS created_by_name
       FROM sale_orders so
       LEFT JOIN clients c ON c.id = so.client_id
       JOIN sites s ON s.id = so.site_id
       LEFT JOIN users u ON u.id = so.created_by
       ${where}
       ORDER BY so.created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...vals, limit, offset]
    );
    return rows;
  }

  static async count(filters) {
    const { where, vals } = this._filters(filters);
    const { rows } = await db.query(
      `SELECT COUNT(*)
       FROM sale_orders so
       LEFT JOIN clients c ON c.id = so.client_id
       ${where}`,
      vals
    );
    return Number.parseInt(rows[0].count, 10);
  }

  static async findById(id) {
    const { rows } = await db.query(
      `SELECT so.*, c.name AS client_registered_name, c.type AS client_type,
              c.payment_terms_days, c.discount_rate, s.name AS site_name
       FROM sale_orders so
       LEFT JOIN clients c ON c.id = so.client_id
       JOIN sites s ON s.id = so.site_id
       WHERE so.id=$1`,
      [id]
    );
    if (!rows[0]) return null;

    const [items, deliveries, invoices, payments] = await Promise.all([
      db.query(
        `SELECT soi.*, p.name AS product_name, p.sku
         FROM sale_order_items soi
         JOIN products p ON p.id = soi.product_id
         WHERE soi.sale_order_id=$1
         ORDER BY soi.id`,
        [id]
      ),
      db.query('SELECT * FROM deliveries WHERE sale_order_id=$1 ORDER BY created_at DESC', [id]),
      db.query('SELECT * FROM invoices WHERE sale_order_id=$1 ORDER BY created_at DESC', [id]),
      db.query('SELECT * FROM payments WHERE sale_order_id=$1 ORDER BY paid_at DESC', [id]),
    ]);

    return {
      ...rows[0],
      items: items.rows,
      deliveries: deliveries.rows,
      invoices: invoices.rows,
      payments: payments.rows,
    };
  }

  static async create(data, client) {
    const { rows } = await runner(client).query(
      `INSERT INTO sale_orders
        (client_id, site_id, reference, channel, client_name, client_phone,
         delivery_required, delivery_address, delivery_fee, discount_amount,
         notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING id`,
      [
        data.client_id || null,
        data.site_id,
        data.reference || null,
        data.channel || 'store',
        data.client_name || null,
        data.client_phone || null,
        data.delivery_required || false,
        data.delivery_address || null,
        data.delivery_fee || 0,
        data.discount_amount || 0,
        data.notes || null,
        data.created_by || null,
      ]
    );
    return rows[0].id;
  }

  static async addItems(sale_order_id, items, client) {
    for (const item of items) {
      await runner(client).query(
        `INSERT INTO sale_order_items
          (sale_order_id, product_id, quantity, unit_price, discount_amount)
         VALUES ($1,$2,$3,$4,$5)`,
        [
          sale_order_id,
          item.product_id,
          item.quantity,
          item.unit_price || 0,
          item.discount_amount || 0,
        ]
      );
    }
  }

  static async refreshTotals(id, client) {
    await runner(client).query(
      `UPDATE sale_orders SET
         subtotal = COALESCE((SELECT SUM(line_total) FROM sale_order_items WHERE sale_order_id=$1),0),
         total_amount = GREATEST(
           COALESCE((SELECT SUM(line_total) FROM sale_order_items WHERE sale_order_id=$1),0)
           - discount_amount + delivery_fee,
           0
         ),
         updated_at=NOW()
       WHERE id=$1`,
      [id]
    );
  }

  static async setStatus(id, status, userId, client) {
    await runner(client).query(
      `UPDATE sale_orders SET
         status=$1,
         confirmed_by = CASE WHEN $1='confirmed' THEN $2 ELSE confirmed_by END,
         confirmed_at = CASE WHEN $1='confirmed' THEN NOW() ELSE confirmed_at END,
         updated_at=NOW()
       WHERE id=$3`,
      [status, userId || null, id]
    );
  }

  static async cancel(id, reason, userId, client) {
    await runner(client).query(
      `UPDATE sale_orders SET status='cancelled', cancelled_by=$1,
         cancelled_at=NOW(), cancellation_reason=$2, updated_at=NOW()
       WHERE id=$3`,
      [userId || null, reason || null, id]
    );
  }

  static async createDelivery(saleOrder, data, userId, client) {
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

  static async findDeliveryById(id) {
    const { rows } = await db.query(
      `SELECT d.*, so.site_id, so.status AS sale_status
       FROM deliveries d
       JOIN sale_orders so ON so.id = d.sale_order_id
       WHERE d.id=$1`,
      [id]
    );
    return rows[0] || null;
  }

  static async setDeliveryStatus(id, status, userId, client) {
    await runner(client).query(
      `UPDATE deliveries SET status=$1,
         delivered_by = CASE WHEN $1='delivered' THEN $2 ELSE delivered_by END,
         delivered_at = CASE WHEN $1='delivered' THEN NOW() ELSE delivered_at END,
         updated_at=NOW()
       WHERE id=$3`,
      [status, userId || null, id]
    );
  }

  static async findInvoiceBySaleOrder(sale_order_id) {
    const { rows } = await db.query(
      'SELECT * FROM invoices WHERE sale_order_id=$1 ORDER BY created_at DESC LIMIT 1',
      [sale_order_id]
    );
    return rows[0] || null;
  }

  static async findInvoiceById(id) {
    const { rows } = await db.query(
      `SELECT i.*, so.site_id, so.status AS sale_status, so.payment_status AS sale_payment_status
       FROM invoices i
       JOIN sale_orders so ON so.id = i.sale_order_id
       WHERE i.id=$1`,
      [id]
    );
    return rows[0] || null;
  }

  static async createInvoice(order, reference, dueDate, userId, client) {
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

  static async addPayment(data, client) {
    const { rows } = await runner(client).query(
      `INSERT INTO payments
        (invoice_id, sale_order_id, cash_session_id, amount, mode, type,
         reference, notes, received_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id`,
      [
        data.invoice_id || null,
        data.sale_order_id || null,
        data.cash_session_id || null,
        data.amount,
        data.mode,
        data.type || 'full',
        data.reference || null,
        data.notes || null,
        data.received_by || null,
      ]
    );
    return rows[0].id;
  }

  static async invoicePaidTotal(invoice_id, client) {
    const { rows } = await runner(client).query(
      'SELECT COALESCE(SUM(amount),0)::numeric AS total FROM payments WHERE invoice_id=$1',
      [invoice_id]
    );
    return Number(rows[0].total || 0);
  }

  static async updateInvoicePayment(invoice_id, paidAmount, status, client) {
    await runner(client).query(
      'UPDATE invoices SET paid_amount=$1, status=$2, updated_at=NOW() WHERE id=$3',
      [paidAmount, status, invoice_id]
    );
  }

  static async updateSalePayment(sale_order_id, paymentStatus, saleStatus, client) {
    await runner(client).query(
      'UPDATE sale_orders SET payment_status=$1, status=$2, updated_at=NOW() WHERE id=$3',
      [paymentStatus, saleStatus, sale_order_id]
    );
  }

  static async listDeliveries(filters) {
    const { status, sale_order_id, date_from, date_to, limit, offset } = filters;
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

  static async countDeliveries(filters) {
    const { status, sale_order_id, date_from, date_to } = filters;
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

  static async listInvoices(filters) {
    const { status, client_id, sale_order_id, date_from, date_to, limit, offset } = filters;
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

  static async countInvoices(filters) {
    const { status, client_id, sale_order_id, date_from, date_to } = filters;
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
    return Number.parseInt(rows[0].count, 10);
  }
}

module.exports = SaleRepository;
