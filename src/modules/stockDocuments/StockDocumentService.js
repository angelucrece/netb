/**
 * Module : service des bons de stock.
 * Rôle : appliquer les règles métier des bons de réception, sortie et transfert.
 * Dépendances principales : StockDocumentRepository, contrôle d'accès, transactions.
 * Auteur : À compléter.
 * Date : 2026-05-28.
 */
const StockDocumentRepository = require('./StockDocumentRepository');
const ApiError = require('../../utils/ApiError');
const paginate = require('../../utils/paginate');
const { logAction } = require('../../utils/auditLog');
const db = require('../../config/database');
const logger = require('../../config/logger');
const {
  assertSiteAccess,
  assertTransferAccess,
  scopeFiltersToUser,
  scopePayloadToUser,
} = require('../../utils/accessControl');

const actorFrom = (userOrId) => ({
  user: typeof userOrId === 'object' && userOrId !== null ? userOrId : null,
  userId: typeof userOrId === 'object' && userOrId !== null ? userOrId.id : userOrId,
});

class StockDocumentService {
  /**
   * Liste les bons visibles par l'utilisateur.
   * @param {object} filters - Filtres.
   * @param {object} [user] - Utilisateur connecté.
   * @returns {Promise<object>} Documents paginés.
   */
  static async getAll(filters, user) {
    const { page = 1, limit = 20, ...rest } = filters;
    const scoped = user?.role ? scopeFiltersToUser(rest, user) : rest;
    const pg = paginate(page, limit, 0);
    const [rows, total] = await Promise.all([
      StockDocumentRepository.findAll({ ...scoped, limit: pg.limit, offset: pg.offset }),
      StockDocumentRepository.count(scoped),
    ]);
    return { documents: rows, pagination: paginate(page, limit, total) };
  }

  /**
   * Charge un bon et contrôle son périmètre.
   * @param {number} id - Identifiant.
   * @param {object} [user] - Utilisateur connecté.
   * @returns {Promise<object>} Bon complet.
   */
  static async getById(id, user) {
    const doc = await StockDocumentRepository.findById(id);
    if (!doc) throw ApiError.notFound('Document introuvable');
    if (user?.role) {
      if (doc.type === 'transfert') assertTransferAccess(user, doc.site_id, doc.destination_site_id);
      else assertSiteAccess(user, doc.site_id);
    }
    return doc;
  }

  /**
   * Crée un bon de stock dans une transaction.
   * Règle : un transfert inter-sites doit avoir une destination distincte.
   * @param {object} data - Données du bon.
   * @param {object|number} userOrId - Utilisateur connecté ou id historique.
   * @returns {Promise<object>} Bon créé.
   */
  static async create(data, userOrId) {
    const { user, userId } = actorFrom(userOrId);
    const scoped = user?.role && data.type !== 'transfert'
      ? scopePayloadToUser(data, user)
      : { ...data };

    if (scoped.type === 'transfert') {
      if (!scoped.destination_site_id) throw ApiError.badRequest('Site destination requis pour un transfert');
      if (Number(scoped.site_id) === Number(scoped.destination_site_id)) {
        throw ApiError.badRequest('Sites source et destination identiques');
      }
      if (user?.role) assertTransferAccess(user, scoped.site_id, scoped.destination_site_id);
    } else if (user?.role) {
      assertSiteAccess(user, scoped.site_id);
    }

    const id = await db.transaction(async (client) => {
      const documentId = await StockDocumentRepository.create({ ...scoped, created_by: userId }, client);
      await StockDocumentRepository.addItems(documentId, scoped.items, client);
      return documentId;
    });

    await logAction({ userId, action: 'CREATE_DOCUMENT', entityType: 'stock_document', entityId: id });
    logger.info('[Documents] Document créé', { id, type: scoped.type, userId });
    return this.getById(id, user);
  }

  /**
   * Valide un bon et applique son effet stock de façon atomique.
   * Règle : transfert inter-sites = débit source, crédit cible et statut du bon
   * validés dans la même transaction.
   * @param {number} id - Document.
   * @param {object|number} userOrId - Utilisateur connecté ou id historique.
   * @returns {Promise<object>} Bon validé.
   */
  static async validate(id, userOrId) {
    const { user, userId } = actorFrom(userOrId);
    const doc = await this.getById(id, user);
    if (doc.status === 'validated') throw ApiError.conflict('Document déjà validé');

    await db.transaction(async (client) => {
      for (const item of doc.items) {
        if (doc.type === 'reception') {
          await client.query(
            `INSERT INTO product_stocks (product_id, site_id, quantity)
             VALUES ($1,$2,$3)
             ON CONFLICT (product_id, site_id)
             DO UPDATE SET quantity=product_stocks.quantity+EXCLUDED.quantity, updated_at=NOW()`,
            [item.product_id, doc.site_id, item.quantity]
          );
          await this.#insertMovement(client, 'entry', item, doc, userId);
        } else if (doc.type === 'sortie') {
          await this.#debitStock(client, item.product_id, doc.site_id, item.quantity);
          await this.#insertMovement(client, 'exit', item, doc, userId);
        } else if (doc.type === 'transfert') {
          await this.#debitStock(client, item.product_id, doc.site_id, item.quantity);
          await client.query(
            `INSERT INTO product_stocks (product_id, site_id, quantity)
             VALUES ($1,$2,$3)
             ON CONFLICT (product_id, site_id)
             DO UPDATE SET quantity=product_stocks.quantity+EXCLUDED.quantity, updated_at=NOW()`,
            [item.product_id, doc.destination_site_id, item.quantity]
          );
          await this.#insertMovement(client, 'transfer', item, doc, userId);
        }
      }
      await StockDocumentRepository.updateStatus(id, 'validated', userId, client);
    });

    await logAction({ userId, action: 'VALIDATE_DOCUMENT', entityType: 'stock_document', entityId: id });
    return this.getById(id, user);
  }

  /**
   * Débite un stock sous verrou.
   * @param {object} client - Client transactionnel.
   * @param {number} productId - Produit.
   * @param {number} siteId - Site.
   * @param {number} quantity - Quantité.
   * @throws {ApiError} 400 si stock insuffisant.
   * @returns {Promise<void>}
   */
  static async #debitStock(client, productId, siteId, quantity) {
    const { rows } = await client.query(
      `SELECT quantity FROM product_stocks WHERE product_id=$1 AND site_id=$2 FOR UPDATE`,
      [productId, siteId]
    );
    if (!rows.length || rows[0].quantity < quantity) {
      throw ApiError.badRequest(`Stock insuffisant pour le produit #${productId}`);
    }
    await client.query(
      `UPDATE product_stocks
       SET quantity=quantity-$1, updated_at=NOW()
       WHERE product_id=$2 AND site_id=$3 AND quantity >= $1`,
      [quantity, productId, siteId]
    );
  }

  /**
   * Trace un mouvement validé pour audit de stock.
   * @param {object} client - Client transactionnel.
   * @param {string} type - Type de mouvement.
   * @param {object} item - Ligne du bon.
   * @param {object} doc - Document parent.
   * @param {number} userId - Utilisateur validateur.
   * @returns {Promise<void>}
   */
  static async #insertMovement(client, type, item, doc, userId) {
    await client.query(
      `INSERT INTO movements
         (type, product_id, site_id, destination_site_id, quantity, user_id, status, motif, validated_by, validated_at)
       VALUES ($1,$2,$3,$4,$5,$6,'validated',$7,$6,NOW())`,
      [
        type,
        item.product_id,
        doc.site_id,
        type === 'transfer' ? doc.destination_site_id : null,
        item.quantity,
        userId || null,
        `Document stock #${doc.id}`,
      ]
    );
  }
}

module.exports = StockDocumentService;
