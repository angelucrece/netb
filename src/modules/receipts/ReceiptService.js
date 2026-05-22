const PDFDocument = require('pdfkit');
const ReceiptRepository = require('./ReceiptRepository');
const ApiError = require('../../utils/ApiError');
const paginate = require('../../utils/paginate');

const toNumber = (value) => Number(value || 0);
const compact = (...parts) => parts.filter(Boolean).join(', ');

const formatMoney = (value) => (
  `${toNumber(value).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} XAF`
);

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('fr-FR');
};

const receiptReference = (paymentId) => {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  return `RCPT-${paymentId}-${stamp}`;
};

class ReceiptService {
  static async getAll(filters) {
    const { page = 1, limit = 20, ...rest } = filters;
    const pg = paginate(page, limit, 0);
    const [rows, total] = await Promise.all([
      ReceiptRepository.findAll({ ...rest, limit: pg.limit, offset: pg.offset }),
      ReceiptRepository.count(rest),
    ]);
    return { receipts: rows, pagination: paginate(page, limit, total) };
  }

  static async getById(id) {
    const receipt = await ReceiptRepository.findById(id);
    if (!receipt) throw ApiError.notFound('Recu introuvable');
    return receipt;
  }

  static async getByPaymentId(paymentId) {
    const receipt = await ReceiptRepository.findByPaymentId(paymentId);
    if (!receipt) throw ApiError.notFound('Recu introuvable pour ce paiement');
    return receipt;
  }

  // Point d'entree appele par PaymentService juste apres un paiement confirme.
  // Il prend un snapshot complet de la vente, puis l'enregistre pour que le recu
  // reste exportable meme si les donnees metier changent plus tard.
  static async generateForPayment(paymentId, options = {}, client) {
    const source = await ReceiptRepository.buildPayloadByPaymentId(paymentId, client);
    if (!source) throw ApiError.notFound('Paiement introuvable pour generation du recu');

    const data = this.buildReceiptData(source, options);
    return ReceiptRepository.create(data, client);
  }

  static buildReceiptData(source, options = {}) {
    const totalAmount = toNumber(source.invoice.total_amount || source.sale_order.total_amount);
    const amountPaid = toNumber(source.payment.amount);
    const amountReceived = toNumber(source.payment.amount_received || source.payment.amount);
    const amountRefunded = toNumber(source.payment.amount_refunded);
    const clientName = source.client.name || source.sale_order.client_name || 'Client comptoir';
    const cashierName = source.cashier.name || 'Caissier';
    const location = compact(source.site.name, source.site.address, source.site.city, source.site.country);

    const payload = {
      receipt: {
        reference: options.reference || receiptReference(source.payment.id),
        issued_at: source.payment.paid_at || new Date(),
      },
      transaction: {
        sale_order_id: source.sale_order.id,
        sale_reference: source.sale_order.reference,
        invoice_id: source.invoice.id,
        invoice_reference: source.invoice.reference,
        transaction_date: source.payment.paid_at,
        sale_date: source.sale_order.created_at,
        location,
      },
      site: source.site,
      client: {
        ...source.client,
        name: clientName,
      },
      cashier: {
        ...source.cashier,
        name: cashierName,
      },
      items: source.items,
      amounts: {
        subtotal: toNumber(source.invoice.subtotal || source.sale_order.subtotal),
        discount_amount: toNumber(source.invoice.discount_amount || source.sale_order.discount_amount),
        delivery_fee: toNumber(source.invoice.delivery_fee || source.sale_order.delivery_fee),
        total_amount: totalAmount,
        amount_paid: amountPaid,
        amount_received: amountReceived,
        amount_refunded: amountRefunded,
      },
      payment: {
        id: source.payment.id,
        mode: source.payment.mode,
        type: source.payment.type,
        reference: source.payment.reference,
        notes: source.payment.notes,
        paid_at: source.payment.paid_at,
      },
      signatures: {
        client_name: clientName,
        cashier_name: cashierName,
        client_signature: options.client_signature || null,
        cashier_signature: options.cashier_signature || null,
      },
    };

    return {
      payment_id: source.payment.id,
      invoice_id: source.invoice.id,
      sale_order_id: source.sale_order.id,
      site_id: source.site.id,
      reference: payload.receipt.reference,
      client_name: clientName,
      cashier_id: source.cashier.id,
      cashier_name: cashierName,
      payment_mode: source.payment.mode,
      total_amount: totalAmount,
      amount_paid: amountPaid,
      amount_received: amountReceived,
      amount_refunded: amountRefunded,
      payload,
      issued_at: payload.receipt.issued_at,
    };
  }

  static async exportPdf(id) {
    const receipt = await this.getById(id);
    return this.renderPdf(receipt);
  }

  static renderPdf(receipt) {
    const payload = receipt.payload || {};
    const items = payload.items || [];
    const amounts = payload.amounts || {};
    const payment = payload.payment || {};
    const transaction = payload.transaction || {};
    const client = payload.client || {};
    const cashier = payload.cashier || {};
    const signatures = payload.signatures || {};

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(18).text('Recu de paiement', { align: 'center' });
      doc.fontSize(10).text('NethaStock', { align: 'center' });
      doc.moveDown();

      doc.fontSize(11).text(`Reference recu: ${receipt.reference}`);
      doc.text(`Date transaction: ${formatDate(transaction.transaction_date || receipt.issued_at)}`);
      doc.text(`Lieu: ${transaction.location || '-'}`);
      doc.text(`Facture: ${transaction.invoice_reference || '-'}`);
      doc.text(`Vente: ${transaction.sale_reference || '-'}`);
      doc.moveDown();

      doc.fontSize(12).text('Client et caisse', { underline: true });
      doc.fontSize(10).text(`Client: ${client.name || '-'}`);
      doc.text(`Telephone client: ${client.phone || '-'}`);
      doc.text(`Adresse client: ${compact(client.address, client.city) || '-'}`);
      doc.text(`Caissier: ${cashier.name || receipt.cashier_name || '-'}`);
      doc.moveDown();

      doc.fontSize(12).text('Produits', { underline: true });
      if (!items.length) {
        doc.fontSize(10).text('Aucun produit trouve pour cette transaction.');
      } else {
        items.forEach((item, index) => {
          doc.fontSize(9).text(
            `${index + 1}. ${item.sku || '-'} | ${item.name || 'Produit'} | ` +
            `PU: ${formatMoney(item.unit_price)} | Qte: ${item.quantity} | ` +
            `Remise: ${formatMoney(item.discount_amount)} | Total: ${formatMoney(item.line_total)}`
          );
        });
      }
      doc.moveDown();

      doc.fontSize(12).text('Paiement', { underline: true });
      doc.fontSize(10).text(`Moyen de paiement: ${payment.mode || receipt.payment_mode || '-'}`);
      doc.text(`Reference paiement: ${payment.reference || '-'}`);
      doc.text(`Montant total: ${formatMoney(amounts.total_amount || receipt.total_amount)}`);
      doc.text(`Montant impute a la facture: ${formatMoney(amounts.amount_paid || receipt.amount_paid)}`);
      doc.text(`Montant recu du client: ${formatMoney(amounts.amount_received || receipt.amount_received)}`);
      doc.text(`Montant rembourse/rendu: ${formatMoney(amounts.amount_refunded || receipt.amount_refunded)}`);
      doc.moveDown(2);

      this.drawSignature(doc, 'Signature client', signatures.client_name || client.name, signatures.client_signature, 40, doc.y);
      this.drawSignature(doc, 'Signature caissier', signatures.cashier_name || cashier.name, signatures.cashier_signature, 320, doc.y - 58);

      doc.end();
    });
  }

  static drawSignature(doc, title, name, signature, x, y) {
    doc.fontSize(10).text(title, x, y, { width: 200 });

    if (signature && typeof signature === 'string' && signature.startsWith('data:image/')) {
      const match = signature.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
      if (match) {
        try {
          doc.image(Buffer.from(match[2], 'base64'), x, y + 16, { fit: [180, 38] });
        } catch (err) {
          doc.text('Signature fournie non lisible', x, y + 22, { width: 200 });
        }
      }
    } else if (signature) {
      doc.text(String(signature).slice(0, 80), x, y + 22, { width: 200 });
    }

    doc.moveTo(x, y + 58).lineTo(x + 180, y + 58).stroke();
    doc.fontSize(9).text(`Nom: ${name || '-'}`, x, y + 62, { width: 200 });
  }
}

module.exports = ReceiptService;
