const InventoryRepository = require('./InventoryRepository');
const ApiError  = require('../../utils/ApiError');
const paginate  = require('../../utils/paginate');
const { logAction } = require('../../utils/auditLog');
const db = require('../../config/database');
const logger = require('../../config/logger');

class InventoryService {

  // ── Sessions ────────────────────────────────────────────
  static async getSessions(filters) {
    const { page = 1, limit = 20, ...rest } = filters;
    const pg = paginate(page, limit, 0);
    const [rows, total] = await Promise.all([
      InventoryRepository.findSessions({ ...rest, limit: pg.limit, offset: pg.offset }),
      InventoryRepository.countSessions(rest),
    ]);
    return { sessions: rows, pagination: paginate(page, limit, total) };
  }

  static async getSessionById(id) {
    const session = await InventoryRepository.findSessionById(id);
    if (!session) throw ApiError.notFound('Session introuvable');
    const items = await InventoryRepository.findItems(id);
    return { ...session, items };
  }

  static async getActiveSession(site_id) {
    const session = await InventoryRepository.findActiveSession(site_id);
    if (!session) throw ApiError.notFound('Aucune session en cours sur ce site');
    const items = await InventoryRepository.findItems(session.id);
    return { ...session, items };
  }

  static async startSession({ site_id, mode }, userId) {
    // Une seule session active par site
    const existing = await InventoryRepository.findActiveSession(site_id);
    if (existing) throw ApiError.conflict('Une session est déjà en cours sur ce site');

    const session = await InventoryRepository.createSession({ site_id, mode, started_by: userId });
    logger.info('[Inventory] Session démarrée', { id: session.id, site_id, mode, userId });
    return session;
  }

  // ── Items ────────────────────────────────────────────────
  static async addItem(session_id, { product_id, counted_qty }, userId) {
    const session = await InventoryRepository.findSessionById(session_id);
    if (!session) throw ApiError.notFound('Session introuvable');
    if (session.status !== 'in_progress') throw ApiError.badRequest('Session non active');

    const item = await InventoryRepository.upsertItem({ session_id, product_id, counted_qty, counted_by: userId });
    return item;
  }

  static async updateItem(session_id, item_id, counted_qty, userId) {
    const session = await InventoryRepository.findSessionById(session_id);
    if (!session) throw ApiError.notFound('Session introuvable');
    if (session.status !== 'in_progress') throw ApiError.badRequest('Session non active');

    const item = await InventoryRepository.updateItem(item_id, counted_qty, userId);
    if (!item) throw ApiError.notFound('Article introuvable');
    return item;
  }

  // ── Écarts ───────────────────────────────────────────────
  static async getGaps(session_id) {
    const session = await InventoryRepository.findSessionById(session_id);
    if (!session) throw ApiError.notFound('Session introuvable');
    const items = await InventoryRepository.findItems(session_id);
    return items.filter(i => i.counted_qty !== null).map(i => ({
      ...i,
      gap: (i.counted_qty || 0) - i.theoretical_qty,
    }));
  }

  // ── Validation (atomique) ────────────────────────────────
  static async validateSession(session_id, userId) {
    const session = await InventoryRepository.findSessionById(session_id);
    if (!session) throw ApiError.notFound('Session introuvable');
    if (session.status !== 'in_progress') throw ApiError.badRequest('Session non active');

    const items = await InventoryRepository.findItems(session_id);

    await db.transaction(async (client) => {
      for (const item of items) {
        if (item.counted_qty === null) continue;
        // Ajuster le stock
        await client.query(
          `UPDATE product_stocks SET quantity=$1, updated_at=NOW()
           WHERE product_id=$2 AND site_id=$3`,
          [item.counted_qty, item.product_id, session.site_id]
        );
        // Mouvement d'ajustement si écart
        const gap = item.counted_qty - item.theoretical_qty;
        if (gap !== 0) {
          await client.query(
            `INSERT INTO movements
               (type, product_id, site_id, quantity, user_id, status, motif)
             VALUES ('adjustment',$1,$2,$3,$4,'validated','Régularisation inventaire')`,
            [item.product_id, session.site_id, Math.abs(gap), userId]
          );
        }
      }
      await InventoryRepository.updateSessionStatus(session_id, 'validated', userId, client);
    });

    await logAction({ userId, action: 'VALIDATE_INVENTORY', entityType: 'inventory_session', entityId: session_id });
    logger.info('[Inventory] Session validée', { session_id, userId });
    return this.getSessionById(session_id);
  }

  // ── Fermeture sans régularisation ────────────────────────
  static async closeSession(session_id, userId) {
    const session = await InventoryRepository.findSessionById(session_id);
    if (!session) throw ApiError.notFound('Session introuvable');
    if (session.status !== 'in_progress') throw ApiError.badRequest('Session non active');
    await InventoryRepository.updateSessionStatus(session_id, 'closed', userId);
    return this.getSessionById(session_id);
  }
}

module.exports = InventoryService;
