const StockMovementRepository = require('./StockMovementRepository');

class StockMovementService {

  // 🔥 création générique
  static async createMovement(data) {
    if (!['entry', 'exit', 'adjustment'].includes(data.type)) {
      throw new Error('Type de mouvement invalide');
    }

    return await StockMovementRepository.create(data);
  }

  // 🔥 historique
  static async getMovements(query) {
    const filters = {
      productId: query.productId,
      siteId: query.siteId,
      type: query.type,
      startDate: query.startDate,
      endDate: query.endDate,
      limit: parseInt(query.limit) || 10,
      offset: ((query.page || 1) - 1) * (query.limit || 10)
    };

    return await StockMovementRepository.findAll(filters);
  }

  // 🔥 statistiques
  static async getStats(query) {
    return await StockMovementRepository.getStats(query);
  }
}

module.exports = StockMovementService;