const db = require('../../config/database');

class StockDocumentRepository {

  static async create(doc) {
    const result = await db.query(
      `INSERT INTO stock_documents (type, site_id, destination_site_id, status, user_id)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [doc.type, doc.siteId, doc.destinationSiteId || null, doc.status, doc.userId]
    );

    return result.rows[0];
  }

  static async addItems(documentId, items) {
    for (const item of items) {
      await db.query(
        `INSERT INTO stock_document_items (document_id, product_id, quantity)
         VALUES ($1,$2,$3)`,
        [documentId, item.productId, item.quantity]
      );
    }
  }

  static async findById(id) {
    const doc = await db.query(
      `SELECT * FROM stock_documents WHERE id=$1`,
      [id]
    );

    const items = await db.query(
      `SELECT * FROM stock_document_items WHERE document_id=$1`,
      [id]
    );

    return {
      ...doc.rows[0],
      items: items.rows
    };
  }

  static async updateStatus(id, status) {
    const result = await db.query(
      `UPDATE stock_documents SET status=$1 WHERE id=$2 RETURNING *`,
      [status, id]
    );

    return result.rows[0];
  }
}

module.exports = StockDocumentRepository;