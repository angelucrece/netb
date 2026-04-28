const express    = require('express');
const router     = express.Router();
const controller = require('./NotificationController');
const { authenticate } = require('../../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notifications internes utilisateur
 */

router.get('/',                authenticate, controller.getAll);
router.patch('/read-all',      authenticate, controller.markAllRead);
router.patch('/:id/read',      authenticate, controller.markRead);
router.post('/fcm-token',      authenticate, controller.saveFcmToken);
router.delete('/:id',          authenticate, controller.remove);

module.exports = router;
