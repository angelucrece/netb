const StockDocumentService = require('./StockDocumentService');

class StockDocumentController {

  static async create(req, res) {
    try {
      const doc = await StockDocumentService.createDocument(
        req.body,
        req.user.id
      );

      res.status(201).json({
        success: true,
        data: doc
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async validate(req, res) {
    try {
      const result = await StockDocumentService.validateDocument(
        req.params.id,
        req.user.id
      );

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

module.exports = StockDocumentController;