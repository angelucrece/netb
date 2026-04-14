const StockMovementService = require('./StockMovementService');

class StockMovementController {

  static async getAll(req, res) {
    try {
      const data = await StockMovementService.getMovements(req.query);

      res.json({
        success: true,
        data
      });

    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async stats(req, res) {
    try {
      const data = await StockMovementService.getStats(req.query);

      res.json({
        success: true,
        data
      });

    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = StockMovementController;