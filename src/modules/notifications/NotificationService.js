const NotificationRepository = require('./NotificationRepository');
const ApiError  = require('../../utils/ApiError');
const paginate  = require('../../utils/paginate');
const logger    = require('../../config/logger');

class NotificationService {

  static async getMyNotifications(user_id, filters) {
    const { page = 1, limit = 20, read } = filters;
    const pg = paginate(page, limit, 0);
    const rows = await NotificationRepository.findByUser(user_id, {
      read, limit: pg.limit, offset: pg.offset,
    });
    const unread = await NotificationRepository.countUnread(user_id);
    return { notifications: rows, unread_count: unread };
  }

  static async markRead(id, user_id) {
    const n = await NotificationRepository.markRead(id, user_id);
    if (!n) throw ApiError.notFound('Notification introuvable');
    return n;
  }

  static async markAllRead(user_id) {
    await NotificationRepository.markAllRead(user_id);
  }

  static async delete(id, user_id) {
    const n = await NotificationRepository.delete(id, user_id);
    if (!n) throw ApiError.notFound('Notification introuvable');
  }

  static async saveFcmToken(user_id, fcm_token) {
    await NotificationRepository.saveFcmToken(user_id, fcm_token);
  }

  // Utilitaire interne : créer une notification (appelé par d'autres services)
  static async notify({ user_id, title, body, type, reference_id, reference_type }) {
    try {
      const n = await NotificationRepository.create({ user_id, title, body, type, reference_id, reference_type });
      logger.info('[Notifications] Notification créée', { user_id, type });
      return n;
    } catch (err) {
      logger.error('[Notifications] Erreur création', { error: err.message });
    }
  }
}

module.exports = NotificationService;
