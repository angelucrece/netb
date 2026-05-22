const StockDocumentRepository = require('./StockDocumentRepository');
const ApiError  = require('../../utils/ApiError');
const paginate  = require('../../utils/paginate');
const { logAction } = require('../../utils/auditLog');
const db = require('../../config/database');
const logger = require('../../config/logger');

class StockDocumentService {

  static async getAll(filters) {
    const { page = 1, limit = 20, ...rest } = filters;
    const pg = paginate(page, limit, 0);
    const [rows, total] = await Promise.all([
      StockDocumentRepository.findAll({ ...rest, limit: pg.limit, offset: pg.offset }),
      StockDocumentRepository.count(rest),
    ]);
    return { documents: rows, pagination: paginate(page, limit, total) };
  }

  static async getById(id) {
    const doc = await StockDocumentRepository.findById(id);
    if (!doc) throw ApiError.notFound('Document introuvable');
    return doc;
  }

  static async create(data, userId) {
    // Document de stock manuel :
    // - reception  : entree de marchandises dans un site
    // - sortie     : sortie de marchandises d'un site
    // - transfert  : deplacement d'un site source vers un site destination
    // Le document est cree en brouillon. Le stock ne change qu'a la validation.
    const id = await StockDocumentRepository.create({ ...data, created_by: userId });
    await StockDocumentRepository.addItems(id, data.items);
    await logAction({ userId, action: 'CREATE_DOCUMENT', entityType: 'stock_document', entityId: id });
    logger.info('[Documents] Document créé', { id, type: data.type, userId });
    return this.getById(id);
  }

  static async validate(id, userId) {
    const doc = await this.getById(id);
    if (doc.status === 'validated') throw ApiError.conflict('Document déjà validé');

    // Validation du bon :
    // c'est ici que le document devient reel pour le stock. Les receptions
    // ajoutent, les sorties retirent, les transferts retirent du site source et
    // ajoutent au site destination.
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
        } else if (doc.type === 'sortie') {
          const { rows } = await client.query(
            `SELECT quantity FROM product_stocks WHERE product_id=$1 AND site_id=$2 FOR UPDATE`,
            [item.product_id, doc.site_id]
          );
          if (!rows.length || rows[0].quantity < item.quantity) {
            throw ApiError.badRequest(`Stock insuffisant pour le produit #${item.product_id}`);
          }
          await client.query(
            `UPDATE product_stocks SET quantity=quantity-$1, updated_at=NOW()
             WHERE product_id=$2 AND site_id=$3`,
            [item.quantity, item.product_id, doc.site_id]
          );
        } else if (doc.type === 'transfert') {
          const { rows } = await client.query(
            `SELECT quantity FROM product_stocks WHERE product_id=$1 AND site_id=$2 FOR UPDATE`,
            [item.product_id, doc.site_id]
          );
          if (!rows.length || rows[0].quantity < item.quantity) {
            throw ApiError.badRequest(`Stock insuffisant pour le produit #${item.product_id}`);
          }
          await client.query(
            `UPDATE product_stocks SET quantity=quantity-$1, updated_at=NOW()
             WHERE product_id=$2 AND site_id=$3`,
            [item.quantity, item.product_id, doc.site_id]
          );
          await client.query(
            `INSERT INTO product_stocks (product_id, site_id, quantity)
             VALUES ($1,$2,$3)
             ON CONFLICT (product_id, site_id)
             DO UPDATE SET quantity=product_stocks.quantity+EXCLUDED.quantity, updated_at=NOW()`,
            [item.product_id, doc.destination_site_id, item.quantity]
          );
        }
      }
      await StockDocumentRepository.updateStatus(id, 'validated', userId);
    });

    await logAction({ userId, action: 'VALIDATE_DOCUMENT', entityType: 'stock_document', entityId: id });
    return this.getById(id);
  }
}

module.exports = StockDocumentService;
