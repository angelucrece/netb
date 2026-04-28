const express    = require('express');
const router     = express.Router();
const controller = require('./ReportController');
const { authenticate, authorize } = require('../../middleware/auth');

const DECISION = authorize('admin','decision_maker','accountant');

/**
 * @swagger
 * tags:
 *   name: Rapports
 *   description: Dashboard, statistiques, exports PDF/Excel
 */

router.get('/dashboard',              authenticate, controller.getDashboard);
router.get('/alerts',                 authenticate, controller.getAlerts);
router.get('/stock',                  authenticate, DECISION, controller.getStock);
router.get('/movements',              authenticate, DECISION, controller.getMovements);
router.get('/sites/stock',            authenticate, DECISION, controller.getSitesStock);
router.get('/inventory/:sessionId',   authenticate, authorize('admin','controller'), controller.getInventoryReport);
router.get('/export/stock',           authenticate, DECISION, controller.exportStock);
router.get('/export/movements',       authenticate, DECISION, controller.exportMovements);

module.exports = router;
