const db = require('../../config/database');

class CashRepository {
  static _filters({ cashier_id, site_id, status, date_from, date_to }) {
    const conds = [];
    const vals = [];
    let i = 1;

    if (cashier_id) { conds.push(`cs.cashier_id = $${i++}`); vals.push(cashier_id); }
    if (site_id) { conds.push(`cs.site_id = $${i++}`); vals.push(site_id); }
    if (status) { conds.push(`cs.status = $${i++}`); vals.push(status); }
    if (date_from) { conds.push(`cs.opened_at >= $${i++}`); vals.push(date_from); }
    if (date_to) { conds.push(`cs.opened_at <= $${i++}`); vals.push(date_to); }

    return { where: conds.length ? `WHERE ${conds.join(' AND ')}` : '', vals, i };
  }

  static async findAll(filters) {
    const { limit, offset, ...rest } = filters;
    const { where, vals, i } = this._filters(rest);
    const { rows } = await db.query(
      `SELECT cs.*, s.name AS site_name,
              u.first_name || ' ' || u.last_name AS cashier_name
       FROM cash_sessions cs
       JOIN sites s ON s.id = cs.site_id
       JOIN users u ON u.id = cs.cashier_id
       ${where}
       ORDER BY cs.opened_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...vals, limit, offset]
    );
    return rows;
  }

  static async count(filters) {
    const { where, vals } = this._filters(filters);
    const { rows } = await db.query(`SELECT COUNT(*) FROM cash_sessions cs ${where}`, vals);
    return Number.parseInt(rows[0].count, 10);
  }

  static async findById(id) {
    const { rows } = await db.query(
      `SELECT cs.*, s.name AS site_name,
              u.first_name || ' ' || u.last_name AS cashier_name
       FROM cash_sessions cs
       JOIN sites s ON s.id = cs.site_id
       JOIN users u ON u.id = cs.cashier_id
       WHERE cs.id=$1`,
      [id]
    );
    return rows[0] || null;
  }

  static async findOpen(cashier_id, site_id) {
    const { rows } = await db.query(
      `SELECT * FROM cash_sessions
       WHERE cashier_id=$1 AND site_id=$2 AND status='open'
       ORDER BY opened_at DESC
       LIMIT 1`,
      [cashier_id, site_id]
    );
    return rows[0] || null;
  }

  static async open({ cashier_id, site_id, opening_balance, notes }) {
    const { rows } = await db.query(
      `INSERT INTO cash_sessions (cashier_id, site_id, opening_balance, notes)
       VALUES ($1,$2,$3,$4)
       RETURNING id`,
      [cashier_id, site_id, opening_balance || 0, notes || null]
    );
    return this.findById(rows[0].id);
  }

  static async paymentTotal(session_id) {
    const { rows } = await db.query(
      `SELECT COALESCE(SUM(amount),0)::numeric AS total
       FROM payments
       WHERE cash_session_id=$1`,
      [session_id]
    );
    return Number(rows[0].total || 0);
  }

  static async close(id, { closing_balance, expected_amount, variance_amount, notes }) {
    await db.query(
      `UPDATE cash_sessions
       SET closing_balance=$1, expected_amount=$2, variance_amount=$3,
           notes=COALESCE($4, notes), status='closed', closed_at=NOW()
       WHERE id=$5`,
      [closing_balance, expected_amount, variance_amount, notes || null, id]
    );
    return this.findById(id);
  }

  static async findPayments({ invoice_id, sale_order_id, cash_session_id, mode, date_from, date_to, limit, offset }) {
    const conds = [];
    const vals = [];
    let i = 1;

    if (invoice_id) { conds.push(`p.invoice_id = $${i++}`); vals.push(invoice_id); }
    if (sale_order_id) { conds.push(`p.sale_order_id = $${i++}`); vals.push(sale_order_id); }
    if (cash_session_id) { conds.push(`p.cash_session_id = $${i++}`); vals.push(cash_session_id); }
    if (mode) { conds.push(`p.mode = $${i++}`); vals.push(mode); }
    if (date_from) { conds.push(`p.paid_at >= $${i++}`); vals.push(date_from); }
    if (date_to) { conds.push(`p.paid_at <= $${i++}`); vals.push(date_to); }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await db.query(
      `SELECT p.*, i.reference AS invoice_reference,
              u.first_name || ' ' || u.last_name AS received_by_name
       FROM payments p
       LEFT JOIN invoices i ON i.id = p.invoice_id
       LEFT JOIN users u ON u.id = p.received_by
       ${where}
       ORDER BY p.paid_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...vals, limit, offset]
    );
    return rows;
  }

  static async countPayments({ invoice_id, sale_order_id, cash_session_id, mode, date_from, date_to }) {
    const conds = [];
    const vals = [];
    let i = 1;
    if (invoice_id) { conds.push(`invoice_id = $${i++}`); vals.push(invoice_id); }
    if (sale_order_id) { conds.push(`sale_order_id = $${i++}`); vals.push(sale_order_id); }
    if (cash_session_id) { conds.push(`cash_session_id = $${i++}`); vals.push(cash_session_id); }
    if (mode) { conds.push(`mode = $${i++}`); vals.push(mode); }
    if (date_from) { conds.push(`paid_at >= $${i++}`); vals.push(date_from); }
    if (date_to) { conds.push(`paid_at <= $${i++}`); vals.push(date_to); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await db.query(`SELECT COUNT(*) FROM payments ${where}`, vals);
    return Number.parseInt(rows[0].count, 10);
  }
}

module.exports = CashRepository;
