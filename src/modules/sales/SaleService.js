/**
 * Module : service des ventes.
 * Rôle : orchestrer commandes client, livraisons, factures et paiements.
 * Dépendances principales : SaleRepository, CashRepository, règles métier,
 * contrôle d'accès, transactions PostgreSQL.
 * Auteur : À compléter.
 * Date : 2026-05-28.
 */
const SaleRepository = require('./SaleRepository');
const CashRepository = require('../cash/CashRepository');
const ApiError = require('../../utils/ApiError');
const paginate = require('../../utils/paginate');
const { logAction } = require('../../utils/auditLog');
const db = require('../../config/database');
const {
  assertSiteAccess,
  scopeFiltersToUser,
  scopePayloadToUser,
  assertDeliveryValidator,
} = require('../../utils/accessControl');
const {
  assertCommercialSite,
  assertOccasionalDepositPaid,
  assertOccasionalBalancePaid,
} = require('../../utils/businessRules');

const invoiceReference = (saleOrderId) => {
  const stamp = Date.now().toString(36).toUpperCase();
  return `INV-${saleOrderId}-${stamp}`;
};

const receiptReference = (saleOrderId) => {
  const stamp = Date.now().toString(36).toUpperCase();
  return `RCPT-${saleOrderId}-${stamp}`;
};

const dueDateFor = (days) => {
  if (!days) return null;
  const date = new Date();
  date.setDate(date.getDate() + Number(days));
  return date.toISOString().slice(0, 10);
};

const actorFrom = (userOrId) => ({
  user: typeof userOrId === 'object' && userOrId !== null ? userOrId : null,
  userId: typeof userOrId === 'object' && userOrId !== null ? userOrId.id : userOrId,
});

const roundMoney = (value) => Math.round(Number(value || 0) * 100) / 100;

const subtotalOf = (items = []) => items.reduce((sum, item) => (
  sum + (Number(item.quantity || 0) * Number(item.unit_price || 0)) - Number(item.discount_amount || 0)
), 0);

class SaleService {
  /**
   * Liste les ventes avec filtrage site automatique pour les rôles locaux.
   * @param {object} filters - Filtres de recherche.
   * @param {object} [user] - Utilisateur connecté.
   * @returns {Promise<object>} Ventes paginées.
   */
  static async getAll(filters, user) {
    const { page = 1, limit = 20, ...rest } = filters;
    const scoped = user?.role ? scopeFiltersToUser(rest, user) : rest;
    const pg = paginate(page, limit, 0);
    const [rows, total] = await Promise.all([
      SaleRepository.findAll({ ...scoped, limit: pg.limit, offset: pg.offset }),
      SaleRepository.count(scoped),
    ]);
    return { sales: rows, pagination: paginate(page, limit, total) };
  }

  /**
   * Charge une vente et vérifie le périmètre site si un utilisateur est fourni.
   * @param {number} id - Identifiant de la vente.
   * @param {object} [user] - Utilisateur connecté.
   * @throws {ApiError} 404 si la vente est absente, 403 si hors périmètre.
   * @returns {Promise<object>} Vente complète.
   */
  static async getById(id, user) {
    const order = await SaleRepository.findById(id);
    if (!order) throw ApiError.notFound('Vente introuvable');
    if (user?.role) assertSiteAccess(user, order.site_id);
    return order;
  }

  /**
   * Crée une commande client.
   * Préconditions critiques :
   * - aucune vente sur un site de type entrepôt ;
   * - une vente entreprise doit référencer un client entreprise actif ;
   * - le site d'un admin agence est forcé à son propre périmètre.
   * @param {object} data - Données de commande.
   * @param {object|number} userOrId - Utilisateur connecté ou identifiant historique.
   * @param {string} ip - Adresse IP.
   * @returns {Promise<object>} Vente créée.
   */
  static async create(data, userOrId, ip) {
    const { user, userId } = actorFrom(userOrId);
    const scopedData = user?.role ? scopePayloadToUser(data, user) : { ...data };
    await assertCommercialSite(scopedData.site_id);

    let client = null;
    if (scopedData.client_id) {
      const { rows } = await db.query(
        'SELECT id, type, payment_terms_days, discount_rate FROM clients WHERE id=$1 AND active=true',
        [scopedData.client_id]
      );
      client = rows[0] || null;
      if (!client) throw ApiError.notFound('Client introuvable ou inactif');
    }

    if (scopedData.channel === 'company') {
      if (!client) throw ApiError.badRequest('Une vente entreprise doit etre rattachee a un client');
      if (client.type !== 'company') throw ApiError.badRequest('Le client doit être de type entreprise');
    }

    const discountAmount = scopedData.discount_amount !== undefined
      ? scopedData.discount_amount
      : scopedData.channel === 'company' && client?.discount_rate
        ? roundMoney(subtotalOf(scopedData.items) * Number(client.discount_rate) / 100)
        : 0;

    const payload = {
      ...scopedData,
      discount_amount: discountAmount,
      client_name: scopedData.client_name || (scopedData.channel === 'store' ? 'Client comptoir' : null),
      created_by: userId,
    };

    const id = await db.transaction(async (clientTx) => {
      const saleId = await SaleRepository.create(payload, clientTx);
      await SaleRepository.addItems(saleId, scopedData.items, clientTx);
      await SaleRepository.refreshTotals(saleId, clientTx);
      return saleId;
    });

    await logAction({ userId, action: 'CREATE_SALE_ORDER', entityType: 'sale_order', entityId: id, newValue: scopedData, ip });
    return this.getById(id, user);
  }

  /**
   * Confirme une vente et débite le stock sous verrou FOR UPDATE.
   * Postcondition : le stock ne peut jamais devenir négatif.
   * @param {number} id - Vente à confirmer.
   * @param {object|number} userOrId - Utilisateur connecté ou id historique.
   * @param {string} ip - Adresse IP.
   * @returns {Promise<object>} Vente confirmée.
   */
  static async confirm(id, userOrId, ip) {
    const { user, userId } = actorFrom(userOrId);
    const order = await this.getById(id, user);
    await assertCommercialSite(order.site_id);
    if (order.status !== 'draft') throw ApiError.badRequest('Seules les ventes brouillon peuvent etre confirmees');

    await db.transaction(async (client) => {
      for (const item of order.items) {
        const stock = await client.query(
          `SELECT quantity FROM product_stocks
           WHERE product_id=$1 AND site_id=$2
           FOR UPDATE`,
          [item.product_id, order.site_id]
        );

        if (!stock.rows.length || stock.rows[0].quantity < item.quantity) {
          throw ApiError.badRequest(`Stock insuffisant pour le produit #${item.product_id}`);
        }

        await client.query(
          `UPDATE product_stocks
           SET quantity=quantity-$1, updated_at=NOW()
           WHERE product_id=$2 AND site_id=$3 AND quantity >= $1`,
          [item.quantity, item.product_id, order.site_id]
        );

        await client.query(
          `INSERT INTO movements
             (type, product_id, site_id, quantity, user_id, status, motif, validated_by, validated_at)
           VALUES ('exit',$1,$2,$3,$4,'validated',$5,$4,NOW())`,
          [item.product_id, order.site_id, item.quantity, userId, `Vente #${order.id}`]
        );
      }

      await SaleRepository.setStatus(id, 'confirmed', userId, client);
    });

    await logAction({ userId, action: 'CONFIRM_SALE_ORDER', entityType: 'sale_order', entityId: id, ip });
    return this.getById(id, user);
  }

  /**
   * Crée le bon de livraison.
   * Règle : client occasionnel = acompte 50% déjà encaissé avant planification.
   * @param {number} id - Vente concernée.
   * @param {object} data - Données de livraison.
   * @param {object|number} userOrId - Utilisateur connecté ou id historique.
   * @param {string} ip - Adresse IP.
   * @returns {Promise<object>} Vente avec livraison.
   */
  static async createDelivery(id, data, userOrId, ip) {
    const { user, userId } = actorFrom(userOrId);
    const order = await this.getById(id, user);
    await assertCommercialSite(order.site_id);
    if (!['confirmed', 'prepared'].includes(order.status)) {
      throw ApiError.badRequest('La vente doit etre confirmee avant livraison');
    }

    const paid = await SaleRepository.salePaidTotal(order.id);
    assertOccasionalDepositPaid(order, paid);

    const deliveryId = await db.transaction(async (client) => {
      const createdId = await SaleRepository.createDelivery(order, data, userId, client);
      await SaleRepository.setStatus(id, 'prepared', userId, client);
      return createdId;
    });

    await logAction({ userId, action: 'CREATE_DELIVERY', entityType: 'delivery', entityId: deliveryId, ip });
    return this.getById(id, user);
  }

  /**
   * Liste les bons de livraison.
   * @param {object} filters - Filtres.
   * @param {object} [user] - Utilisateur connecté.
   * @returns {Promise<object>} Livraisons paginées.
   */
  static async getDeliveries(filters, user) {
    const { page = 1, limit = 20, ...rest } = filters;
    const scoped = user?.role ? scopeFiltersToUser(rest, user) : rest;
    const pg = paginate(page, limit, 0);
    const [rows, total] = await Promise.all([
      SaleRepository.listDeliveries({ ...scoped, limit: pg.limit, offset: pg.offset }),
      SaleRepository.countDeliveries(scoped),
    ]);
    return { deliveries: rows, pagination: paginate(page, limit, total) };
  }

  /**
   * Charge une livraison.
   * @param {number} id - Identifiant livraison.
   * @param {object} [user] - Utilisateur connecté.
   * @returns {Promise<object>} Livraison.
   */
  static async getDeliveryById(id, user) {
    const delivery = await SaleRepository.findDeliveryById(id);
    if (!delivery) throw ApiError.notFound('Bon de livraison introuvable');
    if (user?.role) assertSiteAccess(user, delivery.site_id);
    return delivery;
  }

  /**
   * Démarre une livraison.
   * @param {number} id - Identifiant livraison.
   * @param {object|number} userOrId - Utilisateur connecté ou id historique.
   * @param {string} ip - Adresse IP.
   * @returns {Promise<object>} Livraison mise à jour.
   */
  static async startDelivery(id, userOrId, ip) {
    const { user, userId } = actorFrom(userOrId);
    const delivery = await this.getDeliveryById(id, user);
    if (delivery.status !== 'pending') throw ApiError.badRequest('Livraison non disponible pour depart');
    await SaleRepository.setDeliveryStatus(id, 'in_transit', userId);
    await logAction({ userId, action: 'START_DELIVERY', entityType: 'delivery', entityId: id, ip });
    return this.getDeliveryById(id, user);
  }

  /**
   * Valide la livraison par un responsable.
   * Règles :
   * - validation obligatoire par responsable ;
   * - client occasionnel soldé à la livraison.
   * @param {number} id - Identifiant livraison.
   * @param {object|number} userOrId - Utilisateur connecté ou id historique.
   * @param {string} ip - Adresse IP.
   * @throws {ApiError} 403 si le rôle n'est pas responsable.
   * @returns {Promise<object>} Livraison validée.
   */
  static async validateDelivery(id, userOrId, ip) {
    const { user, userId } = actorFrom(userOrId);
    if (user?.role) assertDeliveryValidator(user);
    const delivery = await this.getDeliveryById(id, user);
    if (!['pending', 'in_transit'].includes(delivery.status)) {
      throw ApiError.badRequest('Livraison deja cloturee');
    }

    const order = await this.getById(delivery.sale_order_id, user);
    await assertCommercialSite(order.site_id);
    const paid = await SaleRepository.salePaidTotal(order.id);
    assertOccasionalBalancePaid(order, paid);

    await db.transaction(async (client) => {
      await SaleRepository.setDeliveryStatus(id, 'delivered', userId, client);
      await SaleRepository.setStatus(delivery.sale_order_id, 'delivered', userId, client);
    });

    await logAction({ userId, action: 'VALIDATE_DELIVERY', entityType: 'delivery', entityId: id, ip });
    return this.getDeliveryById(id, user);
  }

  /**
   * Émet une facture après confirmation/livraison selon le flux.
   * Règle : paiement différé entreprise = 30 ou 60 jours post-dépôt facture.
   * @param {number} id - Vente à facturer.
   * @param {object|number} userOrId - Utilisateur connecté ou id historique.
   * @param {string} ip - Adresse IP.
   * @returns {Promise<object>} Facture.
   */
  static async issueInvoice(id, userOrId, ip) {
    const { user, userId } = actorFrom(userOrId);
    const order = await this.getById(id, user);
    await assertCommercialSite(order.site_id);
    if (['draft', 'cancelled'].includes(order.status)) {
      throw ApiError.badRequest('La vente doit etre confirmee avant facturation');
    }
    if (order.delivery_required && order.status !== 'delivered') {
      throw ApiError.badRequest('La livraison doit etre validee avant facturation');
    }

    const existing = await SaleRepository.findInvoiceBySaleOrder(id);
    if (existing) return SaleRepository.findInvoiceById(existing.id);

    const reference = invoiceReference(id);
    const dueDays = order.channel === 'company' ? Number(order.payment_terms_days || 30) : 0;
    const dueDate = dueDateFor(dueDays);
    const invoiceId = await db.transaction(async (client) => {
      const createdId = await SaleRepository.createInvoice(order, reference, dueDate, userId, client);
      await SaleRepository.setStatus(id, 'invoiced', userId, client);

      const paid = await SaleRepository.salePaidTotal(id, client);
      if (paid > 0) {
        const total = Number(order.total_amount || 0);
        const invoiceStatus = paid >= total ? 'paid' : 'partially_paid';
        const saleStatus = paid >= total ? 'closed' : 'invoiced';
        await SaleRepository.updateInvoicePayment(createdId, paid, invoiceStatus, client);
        await SaleRepository.updateSalePayment(id, paid >= total ? 'paid' : 'partial', saleStatus, client);
      }

      return createdId;
    });

    await logAction({ userId, action: 'ISSUE_INVOICE', entityType: 'invoice', entityId: invoiceId, ip });
    return SaleRepository.findInvoiceById(invoiceId);
  }

  /**
   * Liste les factures en respectant l'isolation site.
   * @param {object} filters - Filtres.
   * @param {object} [user] - Utilisateur connecté.
   * @returns {Promise<object>} Factures paginées.
   */
  static async getInvoices(filters, user) {
    const { page = 1, limit = 20, ...rest } = filters;
    const scoped = user?.role ? scopeFiltersToUser(rest, user) : rest;
    const pg = paginate(page, limit, 0);
    const [rows, total] = await Promise.all([
      SaleRepository.listInvoices({ ...scoped, limit: pg.limit, offset: pg.offset }),
      SaleRepository.countInvoices(scoped),
    ]);
    return { invoices: rows, pagination: paginate(page, limit, total) };
  }

  /**
   * Charge une facture.
   * @param {number} id - Identifiant facture.
   * @param {object} [user] - Utilisateur connecté.
   * @returns {Promise<object>} Facture.
   */
  static async getInvoiceById(id, user) {
    const invoice = await SaleRepository.findInvoiceById(id);
    if (!invoice) throw ApiError.notFound('Facture introuvable');
    if (user?.role) assertSiteAccess(user, invoice.site_id);
    return invoice;
  }

  /**
   * Enregistre un paiement de facture et génère une référence de reçu unique.
   * @param {number} invoiceId - Facture payée.
   * @param {object} data - Données de paiement.
   * @param {object} user - Utilisateur connecté.
   * @param {string} ip - Adresse IP.
   * @returns {Promise<object>} Facture mise à jour.
   */
  static async registerPayment(invoiceId, data, user, ip) {
    const invoice = await this.getInvoiceById(invoiceId, user);
    if (['paid', 'cancelled'].includes(invoice.status)) {
      throw ApiError.badRequest('Facture non encaissable');
    }

    const total = Number(invoice.total_amount || 0);
    const paid = Number(invoice.paid_amount || 0);
    const amount = Number(data.amount);
    if (amount > total - paid + 0.001) {
      throw ApiError.badRequest('Le montant depasse le solde de la facture');
    }

    let cashSessionId = data.cash_session_id || null;
    if (!cashSessionId && ['cash', 'orange_money', 'mtn_money'].includes(data.mode)) {
      const session = await CashRepository.findOpen(user.id, invoice.site_id);
      if (!session) throw ApiError.badRequest('Ouvrez une session de caisse avant encaissement');
      cashSessionId = session.id;
    }

    const paymentId = await db.transaction(async (client) => {
      const createdId = await SaleRepository.addPayment({
        invoice_id: invoice.id,
        sale_order_id: invoice.sale_order_id,
        cash_session_id: cashSessionId,
        amount,
        mode: data.mode,
        type: data.type || 'invoice',
        reference: data.reference || receiptReference(invoice.sale_order_id),
        notes: data.notes,
        received_by: user.id,
      }, client);

      const newPaid = await SaleRepository.invoicePaidTotal(invoice.id, client);
      const invoiceStatus = newPaid >= total ? 'paid' : 'partially_paid';
      const salePaymentStatus = newPaid >= total ? 'paid' : 'partial';
      const saleStatus = newPaid >= total ? 'closed' : invoice.sale_status;

      await SaleRepository.updateInvoicePayment(invoice.id, newPaid, invoiceStatus, client);
      await SaleRepository.updateSalePayment(invoice.sale_order_id, salePaymentStatus, saleStatus, client);
      return createdId;
    });

    await logAction({ userId: user.id, action: 'REGISTER_PAYMENT', entityType: 'payment', entityId: paymentId, newValue: data, ip });
    return this.getInvoiceById(invoiceId, user);
  }

  /**
   * Enregistre un paiement directement sur une vente non encore facturée.
   * Usage : acompte 50% puis solde à la livraison pour client occasionnel.
   * @param {number} saleOrderId - Vente encaissée.
   * @param {object} data - Données de paiement.
   * @param {object} user - Utilisateur connecté.
   * @param {string} ip - Adresse IP.
   * @returns {Promise<object>} Vente mise à jour.
   */
  static async registerSalePayment(saleOrderId, data, user, ip) {
    const order = await this.getById(saleOrderId, user);
    await assertCommercialSite(order.site_id);
    if (['cancelled', 'closed'].includes(order.status)) {
      throw ApiError.badRequest('Vente non encaissable');
    }

    const total = Number(order.total_amount || 0);
    const paid = await SaleRepository.salePaidTotal(order.id);
    const amount = Number(data.amount);
    if (amount > total - paid + 0.001) {
      throw ApiError.badRequest('Le montant depasse le solde de la vente');
    }

    let cashSessionId = data.cash_session_id || null;
    if (!cashSessionId && ['cash', 'orange_money', 'mtn_money'].includes(data.mode)) {
      const session = await CashRepository.findOpen(user.id, order.site_id);
      if (!session) throw ApiError.badRequest('Ouvrez une session de caisse avant encaissement');
      cashSessionId = session.id;
    }

    const paymentId = await db.transaction(async (client) => {
      const createdId = await SaleRepository.addPayment({
        invoice_id: null,
        sale_order_id: order.id,
        cash_session_id: cashSessionId,
        amount,
        mode: data.mode,
        type: data.type || 'deposit',
        reference: data.reference || receiptReference(order.id),
        notes: data.notes,
        received_by: user.id,
      }, client);

      const newPaid = await SaleRepository.salePaidTotal(order.id, client);
      await SaleRepository.updateSalePaymentStatus(
        order.id,
        newPaid >= total ? 'paid' : 'partial',
        client
      );
      return createdId;
    });

    await logAction({ userId: user.id, action: 'REGISTER_SALE_PAYMENT', entityType: 'payment', entityId: paymentId, newValue: data, ip });
    return this.getById(saleOrderId, user);
  }

  /**
   * Annule une vente non encaissée et restitue le stock déjà réservé.
   * @param {number} id - Vente à annuler.
   * @param {string} reason - Motif.
   * @param {object|number} userOrId - Utilisateur connecté ou id historique.
   * @param {string} ip - Adresse IP.
   * @returns {Promise<object>} Vente annulée.
   */
  static async cancel(id, reason, userOrId, ip) {
    const { user, userId } = actorFrom(userOrId);
    const order = await this.getById(id, user);
    if (order.payment_status !== 'unpaid') {
      throw ApiError.badRequest('Impossible d annuler une vente deja encaissee');
    }
    if (['delivered', 'invoiced', 'closed', 'cancelled'].includes(order.status)) {
      throw ApiError.badRequest('Vente non annulable a ce stade');
    }

    await db.transaction(async (client) => {
      if (['confirmed', 'prepared'].includes(order.status)) {
        for (const item of order.items) {
          await client.query(
            `INSERT INTO product_stocks (product_id, site_id, quantity)
             VALUES ($1,$2,$3)
             ON CONFLICT (product_id, site_id)
             DO UPDATE SET quantity=product_stocks.quantity+EXCLUDED.quantity, updated_at=NOW()`,
            [item.product_id, order.site_id, item.quantity]
          );
          await client.query(
            `INSERT INTO movements
               (type, product_id, site_id, quantity, user_id, status, motif, validated_by, validated_at)
             VALUES ('adjustment',$1,$2,$3,$4,'validated',$5,$4,NOW())`,
            [item.product_id, order.site_id, item.quantity, userId, `Annulation vente #${order.id}`]
          );
        }
      }
      await SaleRepository.cancel(id, reason, userId, client);
    });

    await logAction({ userId, action: 'CANCEL_SALE_ORDER', entityType: 'sale_order', entityId: id, newValue: { reason }, ip });
    return this.getById(id, user);
  }
}

module.exports = SaleService;
