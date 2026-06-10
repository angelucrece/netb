const db = require('../../config/database');

const runner = (client) => client || db;
const toNumber = (value) => Number(value || 0);

class ReceiptRepository {
  static _filters({ payment_id, invoice_id, sale_order_id, site_id, cashier_id, date_from, date_to, search }) {
    const conds = [];
    const vals = [];
    let i = 1;

    if (payment_id) { conds.push(`r.payment_id = $${i++}`); vals.push(payment_id); }
    if (invoice_id) { conds.push(`r.invoice_id = $${i++}`); vals.push(invoice_id); }
    if (sale_order_id) { conds.push(`r.sale_order_id = $${i++}`); vals.push(sale_order_id); }
    if (site_id) { conds.push(`r.site_id = $${i++}`); vals.push(site_id); }
    if (cashier_id) { conds.push(`r.cashier_id = $${i++}`); vals.push(cashier_id); }
    if (date_from) { conds.push(`r.issued_at >= $${i++}`); vals.push(date_from); }
    if (date_to) { conds.push(`r.issued_at <= $${i++}`); vals.push(date_to); }
    if (search) {
      conds.push(`(r.reference ILIKE $${i} OR r.client_name ILIKE $${i} OR r.cashier_name ILIKE $${i})`);
      vals.push(`%${search}%`);
      i++;
    }

    return { where: conds.length ? `WHERE ${conds.join(' AND ')}` : '', vals, i };
  }

  static async findAll(filters) {
    const { limit, offset, ...rest } = filters;
    const { where, vals, i } = this._filters(rest);
    const { rows } = await db.query(
      `SELECT r.*, i.reference AS invoice_reference, so.reference AS sale_reference,
              s.name AS site_name
       FROM receipts r
       LEFT JOIN invoices i ON i.id = r.invoice_id
       LEFT JOIN sale_orders so ON so.id = r.sale_order_id
       LEFT JOIN sites s ON s.id = r.site_id
       ${where}
       ORDER BY r.issued_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...vals, limit, offset]
    );
    return rows;
  }

  static async count(filters) {
    const { where, vals } = this._filters(filters);
    const { rows } = await db.query(`SELECT COUNT(*) FROM receipts r ${where}`, vals);
    return Number.parseInt(rows[0].count, 10);
  }

  static async findById(id) {
    const { rows } = await db.query('SELECT * FROM receipts WHERE id=$1', [id]);
    return rows[0] || null;
  }

  static async findByPaymentId(paymentId, client) {
    const { rows } = await runner(client).query('SELECT * FROM receipts WHERE payment_id=$1', [paymentId]);
    return rows[0] || null;
  }

  static async create(data, client) {
    const { rows } = await runner(client).query(
      `INSERT INTO receipts
        (payment_id, invoice_id, sale_order_id, site_id, reference, client_name,
         cashier_id, cashier_name, payment_mode, total_amount, amount_paid,
         amount_received, amount_refunded, payload, issued_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       ON CONFLICT (payment_id) DO UPDATE SET
         invoice_id = EXCLUDED.invoice_id,
         sale_order_id = EXCLUDED.sale_order_id,
         site_id = EXCLUDED.site_id,
         client_name = EXCLUDED.client_name,
         cashier_id = EXCLUDED.cashier_id,
         cashier_name = EXCLUDED.cashier_name,
         payment_mode = EXCLUDED.payment_mode,
         total_amount = EXCLUDED.total_amount,
         amount_paid = EXCLUDED.amount_paid,
         amount_received = EXCLUDED.amount_received,
         amount_refunded = EXCLUDED.amount_refunded,
         payload = EXCLUDED.payload,
         issued_at = EXCLUDED.issued_at
       RETURNING *`,
      [
        data.payment_id,
        data.invoice_id || null,
        data.sale_order_id || null,
        data.site_id || null,
        data.reference,
        data.client_name || null,
        data.cashier_id || null,
        data.cashier_name || null,
        data.payment_mode || null,
        data.total_amount || 0,
        data.amount_paid || 0,
        data.amount_received || 0,
        data.amount_refunded || 0,
        JSON.stringify(data.payload),
        data.issued_at || new Date(),
      ]
    );
    return rows[0];
  }

  // Cette fonction reconstruit toutes les donnees utiles au recu depuis le paiement.
  // On garde ensuite ces donnees dans receipts.payload pour que le PDF reste stable
  // meme si un produit, un client ou un site est modifie plus tard.
  static async buildPayloadByPaymentId(paymentId, client) {
    const { rows } = await runner(client).query(
      `SELECT pay.id AS payment_id,
              pay.invoice_id,
              pay.sale_order_id AS payment_sale_order_id,
              pay.cash_session_id,
              pay.amount,
              COALESCE(pay.amount_received, pay.amount)::numeric AS amount_received,
              COALESCE(pay.amount_refunded, 0)::numeric AS amount_refunded,
              pay.mode,
              pay.type,
              pay.reference AS payment_reference,
              pay.notes AS payment_notes,
              pay.received_by,
              pay.paid_at,
              inv.reference AS invoice_reference,
              inv.issue_date,
              inv.due_date,
              inv.status AS invoice_status,
              inv.subtotal AS invoice_subtotal,
              inv.discount_amount AS invoice_discount_amount,
              inv.delivery_fee AS invoice_delivery_fee,
              inv.total_amount AS invoice_total_amount,
              inv.paid_amount AS invoice_paid_amount,
              so.id AS sale_order_id,
              so.reference AS sale_reference,
              so.channel,
              so.client_name AS sale_client_name,
              so.client_phone AS sale_client_phone,
              so.status AS sale_status,
              so.payment_status AS sale_payment_status,
              so.delivery_address,
              so.subtotal AS sale_subtotal,
              so.discount_amount AS sale_discount_amount,
              so.delivery_fee AS sale_delivery_fee,
              so.total_amount AS sale_total_amount,
              so.created_at AS sale_created_at,
              c.id AS client_id,
              c.name AS registered_client_name,
              c.contact_name AS client_contact_name,
              c.phone AS client_phone,
              c.email AS client_email,
              c.address AS client_address,
              c.city AS client_city,
              s.id AS site_id,
              s.name AS site_name,
              s.address AS site_address,
              s.city AS site_city,
              s.country AS site_country,
              TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')) AS cashier_name,
              u.email AS cashier_email
       FROM payments pay
       LEFT JOIN invoices inv ON inv.id = pay.invoice_id
       LEFT JOIN sale_orders so ON so.id = COALESCE(pay.sale_order_id, inv.sale_order_id)
       LEFT JOIN clients c ON c.id = COALESCE(inv.client_id, so.client_id)
       LEFT JOIN sites s ON s.id = so.site_id
       LEFT JOIN users u ON u.id = pay.received_by
       WHERE pay.id=$1`,
      [paymentId]
    );

    const payment = rows[0];
    if (!payment) return null;

    const itemsResult = await runner(client).query(
      `SELECT soi.product_id, soi.quantity, soi.unit_price, soi.discount_amount,
              soi.line_total, p.name AS product_name, p.sku
       FROM sale_order_items soi
       JOIN products p ON p.id = soi.product_id
       WHERE soi.sale_order_id=$1
       ORDER BY soi.id`,
      [payment.sale_order_id]
    );

    return {
      payment: {
        id: payment.payment_id,
        invoice_id: payment.invoice_id,
        sale_order_id: payment.sale_order_id,
        cash_session_id: payment.cash_session_id,
        amount: toNumber(payment.amount),
        amount_received: toNumber(payment.amount_received),
        amount_refunded: toNumber(payment.amount_refunded),
        mode: payment.mode,
        type: payment.type,
        reference: payment.payment_reference,
        notes: payment.payment_notes,
        received_by: payment.received_by,
        paid_at: payment.paid_at,
      },
      invoice: {
        id: payment.invoice_id,
        reference: payment.invoice_reference,
        issue_date: payment.issue_date,
        due_date: payment.due_date,
        status: payment.invoice_status,
        subtotal: toNumber(payment.invoice_subtotal),
        discount_amount: toNumber(payment.invoice_discount_amount),
        delivery_fee: toNumber(payment.invoice_delivery_fee),
        total_amount: toNumber(payment.invoice_total_amount),
        paid_amount: toNumber(payment.invoice_paid_amount),
      },
      sale_order: {
        id: payment.sale_order_id,
        reference: payment.sale_reference,
        channel: payment.channel,
        client_name: payment.sale_client_name,
        client_phone: payment.sale_client_phone,
        status: payment.sale_status,
        payment_status: payment.sale_payment_status,
        delivery_address: payment.delivery_address,
        subtotal: toNumber(payment.sale_subtotal),
        discount_amount: toNumber(payment.sale_discount_amount),
        delivery_fee: toNumber(payment.sale_delivery_fee),
        total_amount: toNumber(payment.sale_total_amount),
        created_at: payment.sale_created_at,
      },
      site: {
        id: payment.site_id,
        name: payment.site_name,
        address: payment.site_address,
        city: payment.site_city,
        country: payment.site_country,
      },
      client: {
        id: payment.client_id,
        name: payment.registered_client_name || payment.sale_client_name || 'Client comptoir',
        contact_name: payment.client_contact_name,
        phone: payment.client_phone || payment.sale_client_phone,
        email: payment.client_email,
        address: payment.client_address,
        city: payment.client_city,
      },
      cashier: {
        id: payment.received_by,
        name: payment.cashier_name || null,
        email: payment.cashier_email,
      },
      items: itemsResult.rows.map((item) => ({
        product_id: item.product_id,
        sku: item.sku,
        name: item.product_name,
        quantity: Number(item.quantity || 0),
        unit_price: toNumber(item.unit_price),
        discount_amount: toNumber(item.discount_amount),
        line_total: toNumber(item.line_total),
      })),
    };
  }
}

module.exports = ReceiptRepository;
