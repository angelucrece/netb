const express    = require('express');
const router     = express.Router();
const controller = require('./StockController');
const { authenticate, authorize } = require('../../middleware/auth');
const { validate } = require('../../middleware/validation');
const { transferSchema } = require('./StockValidation');

/**
 * @swagger
 * tags:
 *   name: Stocks
 *   description: Stock par site, transferts inter-sites
 */

router.get('/', authenticate, controller.getStocks);
router.get('/:productId/:siteId', authenticate, controller.getByProductAndSite);
router.post('/transfer',
  authenticate,
  authorize('admin','operator_stock','controller','site_manager'),
  validate(transferSchema),
  controller.transfer
);

module.exports = router;
