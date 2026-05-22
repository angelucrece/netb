const PurchaseRepository = require('./PurchaseRepository');
const ApiError = require('../../utils/ApiError');
const paginate = require('../../utils/paginate');
const { logAction } = require('../../utils/auditLog');
const db = require('../../config/database');

class PurchaseService {
  static async getAll(filters) {
    const { page = 1, limit = 20, ...rest } = filters;
    const pg = paginate(page, limit, 0);
    const [rows, total] = await Promise.all([
      PurchaseRepository.findAll({ ...rest, limit: pg.limit, offset: pg.offset }),
      PurchaseRepository.count(rest),
    ]);
    return { purchases: rows, pagination: paginate(page, limit, total) };
  }

  static async getById(id) {
    const order = await PurchaseRepository.findById(id);
    if (!order) throw ApiError.notFound('Commande achat introuvable');
    return order;
  }

  static async create(data, userId, ip) {
    // Bon de commande fournisseur :
    // ce flux sert a commander des produits chez un fournisseur. Il ne modifie
    // pas encore le stock. Le stock sera augmente uniquement au moment de la
    // reception effective de la marchandise.
    const id = await db.transaction(async (client) => {
      const orderId = await PurchaseRepository.create({ ...data, created_by: userId }, client);
      await PurchaseRepository.addItems(orderId, data.items, client);
      await PurchaseRepository.refreshTotal(orderId, client);
      return orderId;
    });

    await logAction({ userId, action: 'CREATE_PURCHASE_ORDER', entityType: 'purchase_order', entityId: id, newValue: data, ip });
    return this.getById(id);
  }

  static async markOrdered(id, userId, ip) {
    const order = await this.getById(id);
    if (order.status !== 'draft') throw ApiError.badRequest('Seules les commandes brouillon peuvent etre envoyees');

    // Passage de brouillon a commande envoyee au fournisseur.
    // A ce stade, aucun mouvement de stock n'est cree.
    await PurchaseRepository.updateStatus(id, 'ordered');
    await logAction({ userId, action: 'ORDER_PURCHASE_ORDER', entityType: 'purchase_order', entityId: id, ip });
    return this.getById(id);
  }

  static async cancel(id, reason, userId, ip) {
    const order = await this.getById(id);
    if (order.status === 'received') throw ApiError.badRequest('Commande deja receptionnee');
    await PurchaseRepository.updateStatus(id, 'cancelled');
    await logAction({ userId, action: 'CANCEL_PURCHASE_ORDER', entityType: 'purchase_order', entityId: id, newValue: { reason }, ip });
    return this.getById(id);
  }

  static async receive(id, payload, userId, ip) {
    // Bon de reception :
    // ce flux correspond a l'arrivee physique des produits depuis le fournisseur.
    // Il augmente le stock, cree un mouvement d'entree valide, puis cree un
    // document stock de type "reception" pour garder une trace administrative.
    const order = await this.getById(id);
    if (order.status === 'cancelled') throw ApiError.badRequest('Commande annulee');
    if (order.status === 'received') throw ApiError.badRequest('Commande deja receptionnee');

    const requested = new Map();
    if (payload.items?.length) {
      for (const item of payload.items) {
        const key = item.item_id ? `item:${item.item_id}` : `product:${item.product_id}`;
        requested.set(key, item.quantity);
      }
    }

    await db.transaction(async (client) => {
      const receivedItems = [];

      for (const item of order.items) {
        const remaining = item.quantity - item.received_quantity;
        if (remaining <= 0) continue;

        const requestedQty = payload.items?.length
          ? requested.get(`item:${item.id}`) ?? requested.get(`product:${item.product_id}`) ?? 0
          : remaining;

        if (!requestedQty) continue;
        if (requestedQty < 0 || requestedQty > remaining) {
          throw ApiError.badRequest(`Quantite receptionnee invalide pour le produit #${item.product_id}`);
        }

        await client.query(
          `UPDATE purchase_order_items
           SET received_quantity = received_quantity + $1
           WHERE id=$2`,
          [requestedQty, item.id]
        );

        await client.query(
          `INSERT INTO product_stocks (product_id, site_id, quantity)
           VALUES ($1,$2,$3)
           ON CONFLICT (product_id, site_id)
           DO UPDATE SET quantity=product_stocks.quantity+EXCLUDED.quantity, updated_at=NOW()`,
          [item.product_id, order.site_id, requestedQty]
        );

        await client.query(
          `INSERT INTO movements
             (type, product_id, site_id, quantity, user_id, status, motif, supplier, validated_by, validated_at)
           VALUES ('entry',$1,$2,$3,$4,'validated',$5,$6,$4,NOW())`,
          [
            item.product_id,
            order.site_id,
            requestedQty,
            userId,
            `Reception commande achat #${order.id}`,
            order.supplier_name || null,
          ]
        );

        receivedItems.push({
          product_id: item.product_id,
          quantity: requestedQty,
          unit_price: item.unit_price,
        });
      }

      if (!receivedItems.length) throw ApiError.badRequest('Aucune quantite a receptionner');

      const doc = await client.query(
        `INSERT INTO stock_documents
          (type, site_id, reference, notes, status, created_by, validated_by, validated_at)
         VALUES ('reception',$1,$2,$3,'validated',$4,$4,NOW())
         RETURNING id`,
        [
          order.site_id,
          order.reference || `PO-${order.id}`,
          payload.notes || `Reception commande achat #${order.id}`,
          userId,
        ]
      );

      for (const item of receivedItems) {
        await client.query(
          `INSERT INTO stock_document_items (document_id, product_id, quantity, unit_price)
           VALUES ($1,$2,$3,$4)`,
          [doc.rows[0].id, item.product_id, item.quantity, item.unit_price || 0]
        );
      }

      const status = await client.query(
        `SELECT bool_and(received_quantity >= quantity) AS complete
         FROM purchase_order_items
         WHERE purchase_order_id=$1`,
        [id]
      );

      await PurchaseRepository.updateStatus(
        id,
        status.rows[0].complete ? 'received' : 'partially_received',
        userId,
        client
      );
    });

    await logAction({ userId, action: 'RECEIVE_PURCHASE_ORDER', entityType: 'purchase_order', entityId: id, newValue: payload, ip });
    return this.getById(id);
  }
}

module.exports = PurchaseService;
