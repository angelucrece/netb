const InvoiceRepository = require('./InvoiceRepository');
const SaleRepository = require('../sales/SaleRepository');
const ApiError = require('../../utils/ApiError');
const paginate = require('../../utils/paginate');
const { logAction } = require('../../utils/auditLog');
const db = require('../../config/database');

const invoiceReference = (saleOrderId) => {
  const stamp = Date.now().toString(36).toUpperCase();
  return `INV-${saleOrderId}-${stamp}`;
};

const dueDateFor = (days) => {
  if (!days) return null;
  const date = new Date();
  date.setDate(date.getDate() + Number(days));
  return date.toISOString().slice(0, 10);
};

class InvoiceService {
  // Cette fonction liste les factures et prepare les informations de pagination.
  static async getAll(filters) {
    const { page = 1, limit = 20, ...rest } = filters;
    const pg = paginate(page, limit, 0);
    const [rows, total] = await Promise.all([
      InvoiceRepository.findAll({ ...rest, limit: pg.limit, offset: pg.offset }),
      InvoiceRepository.count(rest),
    ]);
    return { invoices: rows, pagination: paginate(page, limit, total) };
  }

  // Cette fonction recupere une facture ou declenche une erreur 404.
  static async getById(id) {
    const invoice = await InvoiceRepository.findById(id);
    if (!invoice) throw ApiError.notFound('Facture introuvable');
    return invoice;
  }

  // Cette fonction emet une facture apres validation de la vente/livraison.
  static async issue(saleOrderId, userId, ip) {
    const order = await SaleRepository.findById(saleOrderId);
    if (!order) throw ApiError.notFound('Vente introuvable');
    if (['draft', 'cancelled'].includes(order.status)) {
      throw ApiError.badRequest('La vente doit etre confirmee avant facturation');
    }
    if (order.delivery_required && order.status !== 'delivered') {
      throw ApiError.badRequest('La livraison doit etre validee avant facturation');
    }

    const existing = await InvoiceRepository.findBySaleOrder(saleOrderId);
    if (existing) return InvoiceRepository.findById(existing.id);

    const reference = invoiceReference(saleOrderId);
    const dueDate = dueDateFor(order.payment_terms_days || 0);
    const invoiceId = await db.transaction(async (client) => {
      const createdId = await InvoiceRepository.create(order, reference, dueDate, userId, client);
      await SaleRepository.setStatus(saleOrderId, 'invoiced', userId, client);
      return createdId;
    });

    await logAction({ userId, action: 'ISSUE_INVOICE', entityType: 'invoice', entityId: invoiceId, ip });
    return InvoiceRepository.findById(invoiceId);
  }
}

module.exports = InvoiceService;
