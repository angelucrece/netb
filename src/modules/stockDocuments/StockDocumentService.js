const StockDocumentRepository = require('./StockDocumentRepository');
const StockService = require('../stocks/StockService');
const logger = require('../../config/logger');

class StockDocumentService {

  static async createDocument(data, userId) {
    const document = await StockDocumentRepository.create({
      ...data,
      status: 'draft',
      userId
    });

    await StockDocumentRepository.addItems(document.id, data.items);

    return document;
  }

  static async validateDocument(id, userId) {
    const doc = await StockDocumentRepository.findById(id);

    if (!doc) throw new Error('Document introuvable');

    if (doc.status === 'validated') {
      throw new Error('Document déjà validé');
    }

    logger.info('Validation document', { id });

    for (const item of doc.items) {

      if (doc.type === 'RECEPTION') {
        await StockService.addStock({
          productId: item.product_id,
          siteId: doc.site_id,
          quantity: item.quantity
        });

      } else if (doc.type === 'SORTIE') {
        await StockService.removeStock({
          productId: item.product_id,
          siteId: doc.site_id,
          quantity: item.quantity
        });

      } else if (doc.type === 'TRANSFERT') {
        await StockService.transferStock({
          productId: item.product_id,
          fromSiteId: doc.site_id,
          toSiteId: doc.destination_site_id,
          quantity: item.quantity,
          userId
        });
      }
    }

    return await StockDocumentRepository.updateStatus(id, 'validated');
  }
}

module.exports = StockDocumentService;