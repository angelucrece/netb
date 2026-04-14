const InventoryService = require('./InventoryService');

class InventoryController {

  static async create(req, res) {
    try {
      const result = await InventoryService.createInventory({
        ...req.body,
        userId: req.user.id
      });

      res.status(201).json({
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

  static async getAll(req, res) {
    try {
      const data = await InventoryService.getInventories(req.query);

      res.json({
        success: true,
        data
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = InventoryController;