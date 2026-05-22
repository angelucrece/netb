const db = require('../../config/database');

const runner = (client) => client || db;

class PaymentRepository {
  // Cette fonction enregistre un paiement confirme dans la table payments.
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

  // Cette fonction calcule le total deja paye sur une facture.
  static async invoicePaidTotal(invoice_id, client) {
    const { rows } = await runner(client).query(
      'SELECT COALESCE(SUM(amount),0)::numeric AS total FROM payments WHERE invoice_id=$1',
      [invoice_id]
    );
    return Number(rows[0].total || 0);
  }

  // Cette fonction met a jour le statut de paiement de la vente.
  static async updateSalePayment(sale_order_id, paymentStatus, saleStatus, client) {
    await runner(client).query(
      'UPDATE sale_orders SET payment_status=$1, status=$2, updated_at=NOW() WHERE id=$3',
      [paymentStatus, saleStatus, sale_order_id]
    );
  }

  // Cette fonction cree une transaction externe avant l'appel au provider.
  static async createTransaction(data, client) {
    const { rows } = await runner(client).query(
      `INSERT INTO payment_transactions
        (invoice_id, sale_order_id, provider, amount, currency, mode, type,
         status, request_payload, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',$8,$9)
       RETURNING *`,
      [
        data.invoice_id,
        data.sale_order_id,
        data.provider,
        data.amount,
        data.currency,
        data.mode,
        data.type || 'invoice',
        data.request_payload ? JSON.stringify(data.request_payload) : null,
        data.created_by || null,
      ]
    );
    return rows[0];
  }

  // Cette fonction complete la transaction apres la reponse du provider.
  static async updateTransaction(id, data, client) {
    const { rows } = await runner(client).query(
      `UPDATE payment_transactions SET
         provider_reference = COALESCE($1, provider_reference),
         status = COALESCE($2, status),
         checkout_url = COALESCE($3, checkout_url),
         client_secret = COALESCE($4, client_secret),
         raw_response = COALESCE($5, raw_response),
         updated_at = NOW(),
         confirmed_at = CASE WHEN $2='succeeded' THEN NOW() ELSE confirmed_at END,
         confirmed_by = CASE WHEN $2='succeeded' THEN COALESCE($6, confirmed_by) ELSE confirmed_by END
       WHERE id=$7
       RETURNING *`,
      [
        data.provider_reference || null,
        data.status || null,
        data.checkout_url || null,
        data.client_secret || null,
        data.raw_response ? JSON.stringify(data.raw_response) : null,
        data.confirmed_by || null,
        id,
      ]
    );
    return rows[0] || null;
  }

  // Cette fonction retrouve une transaction externe par son identifiant interne.
  static async findTransactionById(id) {
    const { rows } = await db.query(
      `SELECT pt.*, i.total_amount, i.paid_amount, i.status AS invoice_status
       FROM payment_transactions pt
       JOIN invoices i ON i.id = pt.invoice_id
       WHERE pt.id=$1`,
      [id]
    );
    return rows[0] || null;
  }
}

module.exports = PaymentRepository;
