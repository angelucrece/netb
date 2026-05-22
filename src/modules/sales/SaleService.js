const SaleRepository = require('./SaleRepository');
const ApiError = require('../../utils/ApiError');
const paginate = require('../../utils/paginate');
const { logAction } = require('../../utils/auditLog');
const db = require('../../config/database');

class SaleService {
  static async getAll(filters) {
    const { page = 1, limit = 20, ...rest } = filters;
    const pg = paginate(page, limit, 0);
    const [rows, total] = await Promise.all([
      SaleRepository.findAll({ ...rest, limit: pg.limit, offset: pg.offset }),
      SaleRepository.count(rest),
    ]);
    return { sales: rows, pagination: paginate(page, limit, total) };
  }

  static async getById(id) {
    const order = await SaleRepository.findById(id);
    if (!order) throw ApiError.notFound('Vente introuvable');
    return order;
  }

  static async create(data, userId, ip) {
    // Flux "bon de commande client" :
    // une vente commence ici sous forme de brouillon. Pour une entreprise,
    // le client doit etre rattache a la table clients afin de recuperer ses
    // conditions commerciales: remise, delai de paiement, limite de credit, etc.
    if (data.channel === 'company' && !data.client_id) {
      throw ApiError.badRequest('Une vente entreprise doit etre rattachee a un client');
    }

    const payload = {
      ...data,
      client_name: data.client_name || (data.channel === 'store' ? 'Client comptoir' : null),
      created_by: userId,
    };

    const id = await db.transaction(async (client) => {
      const saleId = await SaleRepository.create(payload, client);
      await SaleRepository.addItems(saleId, data.items, client);
      await SaleRepository.refreshTotals(saleId, client);
      return saleId;
    });

    await logAction({ userId, action: 'CREATE_SALE_ORDER', entityType: 'sale_order', entityId: id, newValue: data, ip });
    return this.getById(id);
  }

  static async confirm(id, userId, ip) {
    const order = await this.getById(id);
    if (order.status !== 'draft') throw ApiError.badRequest('Seules les ventes brouillon peuvent etre confirmees');

    await db.transaction(async (client) => {
      // Confirmation = validation interne de la commande.
      // On reserve/sort le stock immediatement pour eviter de vendre deux fois
      // les memes quantites. Le FOR UPDATE verrouille les lignes de stock pendant
      // la transaction.
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
           WHERE product_id=$2 AND site_id=$3`,
          [item.quantity, item.product_id, order.site_id]
        );

        await client.query(
          `INSERT INTO movements
             (type, product_id, site_id, quantity, user_id, status, motif, validated_by, validated_at)
           VALUES ('exit',$1,$2,$3,$4,'validated',$5,$4,NOW())`,
          [
            item.product_id,
            order.site_id,
            item.quantity,
            userId,
            `Vente #${order.id}`,
          ]
        );
      }

      await SaleRepository.setStatus(id, 'confirmed', userId, client);
    });

    await logAction({ userId, action: 'CONFIRM_SALE_ORDER', entityType: 'sale_order', entityId: id, ip });
    return this.getById(id);
  }

  static async createDelivery(id, data, userId, ip) {
    // Compatibilite ancienne API: la vraie logique est dans DeliveryService.
    return require('../deliveries/DeliveryService').create(id, data, userId, ip);
  }

  static async getDeliveries(filters) {
    // Compatibilite ancienne API: la vraie logique est dans DeliveryService.
    return require('../deliveries/DeliveryService').getAll(filters);
  }

  static async getDeliveryById(id) {
    // Compatibilite ancienne API: la vraie logique est dans DeliveryService.
    return require('../deliveries/DeliveryService').getById(id);
  }

  static async startDelivery(id, userId, ip) {
    // Compatibilite ancienne API: la vraie logique est dans DeliveryService.
    return require('../deliveries/DeliveryService').start(id, userId, ip);
  }

  static async validateDelivery(id, userId, ip) {
    // Compatibilite ancienne API: la vraie logique est dans DeliveryService.
    return require('../deliveries/DeliveryService').validate(id, userId, ip);
  }

  static async issueInvoice(id, userId, ip) {
    // Compatibilite ancienne API: la vraie logique est dans InvoiceService.
    return require('../invoices/InvoiceService').issue(id, userId, ip);
  }

  static async getInvoices(filters) {
    // Compatibilite ancienne API: la vraie logique est dans InvoiceService.
    return require('../invoices/InvoiceService').getAll(filters);
  }

  static async getInvoiceById(id) {
    // Compatibilite ancienne API: la vraie logique est dans InvoiceService.
    return require('../invoices/InvoiceService').getById(id);
  }

  static async registerPayment(invoiceId, data, user, ip) {
    // Compatibilite ancienne API: la vraie logique est dans PaymentService.
    return require('../payments/PaymentService').registerManual(invoiceId, data, user, ip);
  }

  static async cancel(id, reason, userId, ip) {
    const order = await this.getById(id);
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
            [
              item.product_id,
              order.site_id,
              item.quantity,
              userId,
              `Annulation vente #${order.id}`,
            ]
          );
        }
      }
      await SaleRepository.cancel(id, reason, userId, client);
    });

    await logAction({ userId, action: 'CANCEL_SALE_ORDER', entityType: 'sale_order', entityId: id, newValue: { reason }, ip });
    return this.getById(id);
  }
}

module.exports = SaleService;
