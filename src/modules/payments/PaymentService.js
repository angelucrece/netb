const PaymentRepository = require('./PaymentRepository');
const InvoiceRepository = require('../invoices/InvoiceRepository');
const CashRepository = require('../cash/CashRepository');
const ApiError = require('../../utils/ApiError');
const { logAction } = require('../../utils/auditLog');
const db = require('../../config/database');
const { getProvider } = require('./providers/PaymentProviderFactory');

class PaymentService {
  // Cette fonction verifie qu'un paiement ne depasse pas le solde de la facture.
  static ensurePayable(invoice, amount) {
    if (['paid', 'cancelled'].includes(invoice.status)) {
      throw ApiError.badRequest('Facture non encaissable');
    }
    const total = Number(invoice.total_amount || 0);
    const paid = Number(invoice.paid_amount || 0);
    const value = Number(amount);
    if (value > total - paid + 0.001) {
      throw ApiError.badRequest('Le montant depasse le solde de la facture');
    }
  }

  // Cette fonction enregistre un paiement deja confirme au comptoir ou par preuve externe.
  static async registerManual(invoiceId, data, user, ip) {
    const invoice = await InvoiceRepository.findById(invoiceId);
    if (!invoice) throw ApiError.notFound('Facture introuvable');
    this.ensurePayable(invoice, data.amount);

    let cashSessionId = data.cash_session_id || null;
    if (!cashSessionId && ['cash', 'orange_money', 'mtn_money', 'card'].includes(data.mode)) {
      const session = await CashRepository.findOpen(user.id, invoice.site_id);
      if (!session) throw ApiError.badRequest('Ouvrez une session de caisse avant encaissement');
      cashSessionId = session.id;
    }

    const paymentId = await this.applyConfirmedPayment(invoice, {
      amount: Number(data.amount),
      mode: data.mode,
      type: data.type || 'invoice',
      reference: data.reference,
      notes: data.notes,
      cash_session_id: cashSessionId,
      received_by: user.id,
    });

    await logAction({ userId: user.id, action: 'REGISTER_PAYMENT', entityType: 'payment', entityId: paymentId, newValue: data, ip });
    return InvoiceRepository.findById(invoiceId);
  }

  // Cette fonction initialise un vrai paiement externe chez Stripe, MTN MoMo ou Orange Money.
  static async initiateExternal(invoiceId, data, user, ip) {
    const invoice = await InvoiceRepository.findById(invoiceId);
    if (!invoice) throw ApiError.notFound('Facture introuvable');
    this.ensurePayable(invoice, data.amount);

    const transaction = await PaymentRepository.createTransaction({
      invoice_id: invoice.id,
      sale_order_id: invoice.sale_order_id,
      provider: data.provider,
      amount: Number(data.amount),
      currency: data.currency || 'XAF',
      mode: data.provider,
      type: data.type || 'invoice',
      request_payload: data,
      created_by: user.id,
    });

    const provider = getProvider(data.provider);
    const providerResult = await provider.initiate({ transaction, invoice, payload: data });
    const updated = await PaymentRepository.updateTransaction(transaction.id, providerResult);

    await logAction({ userId: user.id, action: 'INITIATE_EXTERNAL_PAYMENT', entityType: 'payment_transaction', entityId: transaction.id, newValue: { provider: data.provider }, ip });
    return updated;
  }

  // Cette fonction consulte le provider et confirme le paiement uniquement si le provider dit "succeeded".
  static async refreshExternalStatus(transactionId, user, ip) {
    const transaction = await PaymentRepository.findTransactionById(transactionId);
    if (!transaction) throw ApiError.notFound('Transaction de paiement introuvable');
    if (!transaction.provider_reference) throw ApiError.badRequest('Reference provider manquante');

    const provider = getProvider(transaction.provider);
    const status = await provider.fetchStatus(transaction.provider_reference);
    const updated = await PaymentRepository.updateTransaction(transaction.id, {
      status: status.status,
      raw_response: status.raw_response,
      confirmed_by: user.id,
    });

    if (updated.status === 'succeeded') {
      const invoice = await InvoiceRepository.findById(transaction.invoice_id);
      await this.applyConfirmedPayment(invoice, {
        amount: Number(transaction.amount),
        mode: transaction.mode,
        type: transaction.type || 'invoice',
        reference: transaction.provider_reference,
        notes: `Paiement ${transaction.provider}`,
        received_by: user.id,
      });
    }

    await logAction({ userId: user.id, action: 'REFRESH_EXTERNAL_PAYMENT', entityType: 'payment_transaction', entityId: transaction.id, newValue: { status: updated.status }, ip });
    return updated;
  }

  // Cette fonction applique les effets metier d'un paiement confirme: payment, facture, vente.
  static async applyConfirmedPayment(invoice, data) {
    this.ensurePayable(invoice, data.amount);

    return db.transaction(async (client) => {
      const paymentId = await PaymentRepository.addPayment({
        invoice_id: invoice.id,
        sale_order_id: invoice.sale_order_id,
        cash_session_id: data.cash_session_id || null,
        amount: data.amount,
        mode: data.mode,
        type: data.type || 'invoice',
        reference: data.reference,
        notes: data.notes,
        received_by: data.received_by,
      }, client);

      const newPaid = await PaymentRepository.invoicePaidTotal(invoice.id, client);
      const total = Number(invoice.total_amount || 0);
      const invoiceStatus = newPaid >= total ? 'paid' : 'partially_paid';
      const salePaymentStatus = newPaid >= total ? 'paid' : 'partial';
      const saleStatus = newPaid >= total ? 'closed' : invoice.sale_status;

      await InvoiceRepository.updatePayment(invoice.id, newPaid, invoiceStatus, client);
      await PaymentRepository.updateSalePayment(invoice.sale_order_id, salePaymentStatus, saleStatus, client);
      return paymentId;
    });
  }
}

module.exports = PaymentService;
