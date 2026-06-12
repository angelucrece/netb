const MovementRepository = require('./StockMovementRepository');
const StockRepository   = require('../stocks/StockRepository');
const ApiError  = require('../../utils/ApiError');
const paginate  = require('../../utils/paginate');
const { logAction } = require('../../utils/auditLog');
const db = require('../../config/database');
const logger = require('../../config/logger');
const { assertSiteAccess, assertTransferAccess, scopeFiltersToUser } = require('../../utils/accessControl');

const actorFrom = (userOrId) => ({
  user: typeof userOrId === 'object' && userOrId !== null ? userOrId : null,
  userId: typeof userOrId === 'object' && userOrId !== null ? userOrId.id : userOrId,
});

class MovementService {

  static async getAll(filters, user) {
    const { page = 1, limit = 20, ...rest } = filters;
    const scoped = user?.role ? scopeFiltersToUser(rest, user) : rest;
    const pg = paginate(page, limit, 0);
    const [rows, total] = await Promise.all([
      MovementRepository.findAll({ ...scoped, limit: pg.limit, offset: pg.offset }),
      MovementRepository.count(scoped),
    ]);
    return { movements: rows, pagination: paginate(page, limit, total) };
  }

  static async getById(id, user) {
    const m = await MovementRepository.findById(id);
    if (!m) throw ApiError.notFound('Mouvement introuvable');
    if (user?.role) {
      if (m.type === 'transfer') assertTransferAccess(user, m.site_id, m.destination_site_id);
      else assertSiteAccess(user, m.site_id);
    }
    return m;
  }

  static async getPending(site_id, user) {
    const scopedSiteId = user?.role ? scopeFiltersToUser({ site_id }, user).site_id : site_id;
    return await MovementRepository.findPending(scopedSiteId);
  }

  // ── Entrée ──────────────────────────────────────────────
  static async createEntry({ product_id, site_id, quantity, motif, supplier }, userOrId) {
    const { user, userId } = actorFrom(userOrId);
    if (user?.role) assertSiteAccess(user, site_id);
    const movement = await MovementRepository.create({
      type: 'entry', product_id, site_id, quantity, user_id: userId, motif, supplier,
    });
    logger.info('[Movements] Entrée créée', { id: movement.id, product_id, quantity });
    return movement;
  }

  // ── Sortie ───────────────────────────────────────────────
  static async createExit({ product_id, site_id, quantity, motif }, userOrId) {
    const { user, userId } = actorFrom(userOrId);
    if (user?.role) assertSiteAccess(user, site_id);
    // Vérifier stock disponible
    const stock = await StockRepository.findByProductAndSite(product_id, site_id);
    if (!stock || stock.quantity < quantity) {
      throw ApiError.badRequest('Stock insuffisant pour cette sortie');
    }
    const movement = await MovementRepository.create({
      type: 'exit', product_id, site_id, quantity, user_id: userId, motif,
    });
    logger.info('[Movements] Sortie créée', { id: movement.id, product_id, quantity });
    return movement;
  }

  // ── Transfert inter-sites (atomique) ─────────────────────
  static async createTransfer({ from_site_id, to_site_id, items, motif }, userOrId) {
    const { user, userId } = actorFrom(userOrId);
    if (from_site_id === to_site_id) throw ApiError.badRequest('Sites identiques');
    if (user?.role) assertTransferAccess(user, from_site_id, to_site_id);

    return await db.transaction(async (client) => {
      const movements = [];

      for (const item of items) {
        const { product_id, quantity } = item;

        // Vérifier stock source
        const { rows } = await client.query(
          `SELECT quantity FROM product_stocks WHERE product_id=$1 AND site_id=$2 FOR UPDATE`,
          [product_id, from_site_id]
        );
        if (!rows.length || rows[0].quantity < quantity) {
          throw ApiError.badRequest(`Stock insuffisant pour le produit #${product_id}`);
        }

        // Décrémenter source
        await client.query(
          `UPDATE product_stocks SET quantity=quantity-$1, updated_at=NOW()
           WHERE product_id=$2 AND site_id=$3`,
          [quantity, product_id, from_site_id]
        );

        // Incrémenter destination (upsert)
        await client.query(
          `INSERT INTO product_stocks (product_id, site_id, quantity)
           VALUES ($1,$2,$3)
           ON CONFLICT (product_id, site_id)
           DO UPDATE SET quantity=product_stocks.quantity+EXCLUDED.quantity, updated_at=NOW()`,
          [product_id, to_site_id, quantity]
        );

        // Enregistrer le mouvement
        const { rows: mRows } = await client.query(
          `INSERT INTO movements
             (type, product_id, site_id, destination_site_id, quantity, user_id, motif, status)
           VALUES ('transfer',$1,$2,$3,$4,$5,$6,'validated') RETURNING id`,
          [product_id, from_site_id, to_site_id, quantity, userId, motif||null]
        );
        movements.push(mRows[0].id);
      }

      logger.info('[Movements] Transfert effectué', { from_site_id, to_site_id, userId });
      return { message: 'Transfert effectué', movement_ids: movements };
    });
  }

  // ── Validation ───────────────────────────────────────────
  static async validate(id, userOrId) {
    const { user, userId } = actorFrom(userOrId);
    const m = await this.getById(id, user);
    if (m.status !== 'pending') throw ApiError.badRequest('Mouvement non en attente');

    await db.transaction(async (client) => {
      // Mettre à jour le stock
      if (m.type === 'entry') {
        await client.query(
          `INSERT INTO product_stocks (product_id, site_id, quantity)
           VALUES ($1,$2,$3)
           ON CONFLICT (product_id, site_id)
           DO UPDATE SET quantity=product_stocks.quantity+EXCLUDED.quantity, updated_at=NOW()`,
          [m.product_id, m.site_id, m.quantity]
        );
      } else if (m.type === 'exit') {
        const { rows } = await client.query(
          `SELECT quantity FROM product_stocks WHERE product_id=$1 AND site_id=$2 FOR UPDATE`,
          [m.product_id, m.site_id]
        );
        if (!rows.length || rows[0].quantity < m.quantity) {
          throw ApiError.badRequest('Stock insuffisant pour valider cette sortie');
        }
        await client.query(
          `UPDATE product_stocks SET quantity=quantity-$1, updated_at=NOW()
           WHERE product_id=$2 AND site_id=$3`,
          [m.quantity, m.product_id, m.site_id]
        );
      }
      await MovementRepository.updateStatus(id, 'validated', userId, null, client);
    });

    await logAction({ userId, action: 'VALIDATE_MOVEMENT', entityType: 'movement', entityId: id });
    return this.getById(id);
  }

  // ── Rejet ────────────────────────────────────────────────
  static async reject(id, rejection_reason, userOrId) {
    const { user, userId } = actorFrom(userOrId);
    const m = await this.getById(id, user);
    if (m.status !== 'pending') throw ApiError.badRequest('Mouvement non en attente');
    await MovementRepository.updateStatus(id, 'rejected', userId, rejection_reason);
    await logAction({ userId, action: 'REJECT_MOVEMENT', entityType: 'movement', entityId: id });
    return this.getById(id);
  }
}

module.exports = MovementService;
