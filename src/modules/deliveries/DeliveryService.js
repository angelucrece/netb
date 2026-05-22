const DeliveryRepository = require('./DeliveryRepository');
const SaleRepository = require('../sales/SaleRepository');
const ApiError = require('../../utils/ApiError');
const paginate = require('../../utils/paginate');
const { logAction } = require('../../utils/auditLog');
const db = require('../../config/database');

class DeliveryService {
  // Cette fonction retourne les bons de livraison avec leur pagination.
  static async getAll(filters) {
    const { page = 1, limit = 20, ...rest } = filters;
    const pg = paginate(page, limit, 0);
    const [rows, total] = await Promise.all([
      DeliveryRepository.findAll({ ...rest, limit: pg.limit, offset: pg.offset }),
      DeliveryRepository.count(rest),
    ]);
    return { deliveries: rows, pagination: paginate(page, limit, total) };
  }

  // Cette fonction recupere un bon de livraison ou renvoie une erreur 404.
  static async getById(id) {
    const delivery = await DeliveryRepository.findById(id);
    if (!delivery) throw ApiError.notFound('Bon de livraison introuvable');
    return delivery;
  }

  // Cette fonction cree le bon de livraison apres confirmation de la vente.
  static async create(saleOrderId, data, userId, ip) {
    const order = await SaleRepository.findById(saleOrderId);
    if (!order) throw ApiError.notFound('Vente introuvable');
    if (!['confirmed', 'prepared'].includes(order.status)) {
      throw ApiError.badRequest('La vente doit etre confirmee avant livraison');
    }

    const deliveryId = await db.transaction(async (client) => {
      const createdId = await DeliveryRepository.create(order, data, userId, client);
      await SaleRepository.setStatus(saleOrderId, 'prepared', userId, client);
      return createdId;
    });

    await logAction({ userId, action: 'CREATE_DELIVERY', entityType: 'delivery', entityId: deliveryId, ip });
    return SaleRepository.findById(saleOrderId);
  }

  // Cette fonction marque la livraison comme demarree par le livreur.
  static async start(id, userId, ip) {
    const delivery = await this.getById(id);
    if (delivery.status !== 'pending') throw ApiError.badRequest('Livraison non disponible pour depart');

    await DeliveryRepository.setStatus(id, 'in_transit', userId);
    await logAction({ userId, action: 'START_DELIVERY', entityType: 'delivery', entityId: id, ip });
    return this.getById(id);
  }

  // Cette fonction valide la livraison apres controle des produits chez le client.
  static async validate(id, userId, ip) {
    const delivery = await this.getById(id);
    if (!['pending', 'in_transit'].includes(delivery.status)) {
      throw ApiError.badRequest('Livraison deja cloturee');
    }

    await db.transaction(async (client) => {
      await DeliveryRepository.setStatus(id, 'delivered', userId, client);
      await SaleRepository.setStatus(delivery.sale_order_id, 'delivered', userId, client);
    });

    await logAction({ userId, action: 'VALIDATE_DELIVERY', entityType: 'delivery', entityId: id, ip });
    return this.getById(id);
  }
}

module.exports = DeliveryService;
