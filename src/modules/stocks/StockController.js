// StockController.js
// ===== Contrôleur pour gérer les routes stock =====
const StockService = require('./StockService');

class StockController {

  // GET /api/stocks?site_id=&productId=
  static async getStocks(req, res) {
    try {
      const filters = {
        site_id: req.query.site_id,
        product_id: req.query.product_id
      };
      const stocks = await StockService.getStocks(filters);
      res.json({ success: true, data: stocks });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // POST /api/stocks/add
  static async addStock(req, res) {
    try {
      const stock = await StockService.addStock(req.body);
      res.status(201).json({ success: true, data: stock });
    } catch (error) {
      console.error(error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // POST /api/stocks/remove
  static async removeStock(req, res) {
    try {
      const stock = await StockService.removeStock(req.body);
      res.json({ success: true, data: stock });
    } catch (error) {
      console.error(error);
      res.status(400).json({ success: false, message: error.message });
    }
  }


  // POST /api/stocks/update
  static async updateStock(req, res) {
    try {
      const stock = await StockService.updateStock(req.body);
      res.json({ success: true, data: stock });
    } catch (error) {
      console.error(error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // POST /api/stocks/transfer
  static async transfer(req, res) {
  try {
    const result = await StockService.transferStock({
      ...req.body,
      userId: req.user.id
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}
}

module.exports = StockController;