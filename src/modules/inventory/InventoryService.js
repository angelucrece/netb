/**
 * Module : service d'inventaire.
 * Rôle : gérer les sessions d'inventaire et les régularisations de stock.
 * Dépendances principales : InventoryRepository, transactions PostgreSQL,
 * contrôle d'accès site.
 * Auteur : À compléter.
 * Date : 2026-05-28.
 */
const InventoryRepository = require('./InventoryRepository');
const ApiError = require('../../utils/ApiError');
const paginate = require('../../utils/paginate');
const { logAction } = require('../../utils/auditLog');
const db = require('../../config/database');
const logger = require('../../config/logger');
const {
  assertSiteAccess,
  scopeFiltersToUser,
  scopePayloadToUser,
} = require('../../utils/accessControl');

const actorFrom = (userOrId) => ({
  user: typeof userOrId === 'object' && userOrId !== null ? userOrId : null,
  userId: typeof userOrId === 'object' && userOrId !== null ? userOrId.id : userOrId,
});

class InventoryService {
  /**
   * Liste les sessions d'inventaire visibles.
   * @param {object} filters - Filtres et pagination.
   * @param {object} [user] - Utilisateur connecté.
   * @returns {Promise<object>} Sessions paginées.
   */
  static async getSessions(filters, user) {
    const { page = 1, limit = 20, ...rest } = filters;
    const scoped = user?.role ? scopeFiltersToUser(rest, user) : rest;
    const pg = paginate(page, limit, 0);
    const [rows, total] = await Promise.all([
      InventoryRepository.findSessions({ ...scoped, limit: pg.limit, offset: pg.offset }),
      InventoryRepository.countSessions(scoped),
    ]);
    return { sessions: rows, pagination: paginate(page, limit, total) };
  }

  /**
   * Charge une session avec ses lignes.
   * @param {number} id - Session.
   * @param {object} [user] - Utilisateur connecté.
   * @returns {Promise<object>} Session complète.
   */
  static async getSessionById(id, user) {
    const session = await InventoryRepository.findSessionById(id);
    if (!session) throw ApiError.notFound('Session introuvable');
    if (user?.role) assertSiteAccess(user, session.site_id);
    const items = await InventoryRepository.findItems(id);
    return { ...session, items };
  }

  /**
   * Charge la session active d'un site.
   * @param {number} site_id - Site.
   * @param {object} [user] - Utilisateur connecté.
   * @returns {Promise<object>} Session active.
   */
  static async getActiveSession(site_id, user) {
    if (user?.role) assertSiteAccess(user, site_id);
    const session = await InventoryRepository.findActiveSession(site_id);
    if (!session) throw ApiError.notFound('Aucune session en cours sur ce site');
    const items = await InventoryRepository.findItems(session.id);
    return { ...session, items };
  }

  /**
   * Démarre une session d'inventaire.
   * Précondition : une seule session active par site.
   * @param {object} payload - site_id et mode.
   * @param {object|number} userOrId - Utilisateur connecté ou id historique.
   * @returns {Promise<object>} Session créée.
   */
  static async startSession(payload, userOrId) {
    const { user, userId } = actorFrom(userOrId);
    const scoped = user?.role ? scopePayloadToUser(payload, user) : payload;
    const existing = await InventoryRepository.findActiveSession(scoped.site_id);
    if (existing) throw ApiError.conflict('Une session est déjà en cours sur ce site');

    const session = await InventoryRepository.createSession({
      site_id: scoped.site_id,
      mode: scoped.mode,
      started_by: userId,
    });
    logger.info('[Inventory] Session démarrée', { id: session.id, site_id: scoped.site_id, mode: scoped.mode, userId });
    return session;
  }

  /**
   * Ajoute ou met à jour le comptage d'un produit.
   * @param {number} session_id - Session.
   * @param {object} payload - Produit et quantité comptée.
   * @param {object|number} userOrId - Compteur.
   * @returns {Promise<object>} Ligne d'inventaire.
   */
  static async addItem(session_id, { product_id, counted_qty }, userOrId) {
    const { user, userId } = actorFrom(userOrId);
    const session = await InventoryRepository.findSessionById(session_id);
    if (!session) throw ApiError.notFound('Session introuvable');
    if (user?.role) assertSiteAccess(user, session.site_id);
    if (session.status !== 'in_progress') throw ApiError.badRequest('Session non active');

    return await InventoryRepository.upsertItem({ session_id, product_id, counted_qty, counted_by: userId });
  }

  /**
   * Modifie une ligne d'inventaire.
   * @param {number} session_id - Session.
   * @param {number} item_id - Ligne.
   * @param {number} counted_qty - Quantité comptée.
   * @param {object|number} userOrId - Utilisateur.
   * @returns {Promise<object>} Ligne mise à jour.
   */
  static async updateItem(session_id, item_id, counted_qty, userOrId) {
    const { user, userId } = actorFrom(userOrId);
    const session = await InventoryRepository.findSessionById(session_id);
    if (!session) throw ApiError.notFound('Session introuvable');
    if (user?.role) assertSiteAccess(user, session.site_id);
    if (session.status !== 'in_progress') throw ApiError.badRequest('Session non active');

    const item = await InventoryRepository.updateItem(item_id, counted_qty, userId);
    if (!item) throw ApiError.notFound('Article introuvable');
    return item;
  }

  /**
   * Calcule les écarts d'inventaire.
   * @param {number} session_id - Session.
   * @param {object} [user] - Utilisateur connecté.
   * @returns {Promise<object[]>} Écarts.
   */
  static async getGaps(session_id, user) {
    const session = await InventoryRepository.findSessionById(session_id);
    if (!session) throw ApiError.notFound('Session introuvable');
    if (user?.role) assertSiteAccess(user, session.site_id);
    const items = await InventoryRepository.findItems(session_id);
    return items.filter((i) => i.counted_qty !== null).map((i) => ({
      ...i,
      gap: (i.counted_qty || 0) - i.theoretical_qty,
    }));
  }

  /**
   * Valide une session et régularise le stock dans une transaction.
   * Postcondition : chaque ajustement de stock et son mouvement d'audit sont atomiques.
   * @param {number} session_id - Session.
   * @param {object|number} userOrId - Validateur.
   * @returns {Promise<object>} Session validée.
   */
  static async validateSession(session_id, userOrId) {
    const { user, userId } = actorFrom(userOrId);
    const session = await InventoryRepository.findSessionById(session_id);
    if (!session) throw ApiError.notFound('Session introuvable');
    if (user?.role) assertSiteAccess(user, session.site_id);
    if (session.status !== 'in_progress') throw ApiError.badRequest('Session non active');

    const items = await InventoryRepository.findItems(session_id);

    await db.transaction(async (client) => {
      for (const item of items) {
        if (item.counted_qty === null) continue;
        await client.query(
          `UPDATE product_stocks SET quantity=$1, updated_at=NOW()
           WHERE product_id=$2 AND site_id=$3`,
          [item.counted_qty, item.product_id, session.site_id]
        );
        const gap = item.counted_qty - item.theoretical_qty;
        if (gap !== 0) {
          await client.query(
            `INSERT INTO movements
               (type, product_id, site_id, quantity, user_id, status, motif, validated_by, validated_at)
             VALUES ('adjustment',$1,$2,$3,$4,'validated','Régularisation inventaire',$4,NOW())`,
            [item.product_id, session.site_id, Math.abs(gap), userId]
          );
        }
      }
      await InventoryRepository.updateSessionStatus(session_id, 'validated', userId, client);
    });

    await logAction({ userId, action: 'VALIDATE_INVENTORY', entityType: 'inventory_session', entityId: session_id });
    logger.info('[Inventory] Session validée', { session_id, userId });
    return this.getSessionById(session_id, user);
  }

  /**
   * Ferme une session sans régulariser le stock.
   * @param {number} session_id - Session.
   * @param {object|number} userOrId - Utilisateur.
   * @returns {Promise<object>} Session fermée.
   */
  static async closeSession(session_id, userOrId) {
    const { user, userId } = actorFrom(userOrId);
    const session = await InventoryRepository.findSessionById(session_id);
    if (!session) throw ApiError.notFound('Session introuvable');
    if (user?.role) assertSiteAccess(user, session.site_id);
    if (session.status !== 'in_progress') throw ApiError.badRequest('Session non active');
    await InventoryRepository.updateSessionStatus(session_id, 'closed', userId);
    return this.getSessionById(session_id, user);
  }
}

module.exports = InventoryService;
