const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/ApiResponse');
const NotificationService = require('./NotificationService');

const getAll = asyncHandler(async (req, res) => {
  const data = await NotificationService.getMyNotifications(req.user.id, req.query);
  success(res, data);
});

const markRead = asyncHandler(async (req, res) => {
  const n = await NotificationService.markRead(parseInt(req.params.id), req.user.id);
  success(res, n, 'Notification lue');
});

const markAllRead = asyncHandler(async (req, res) => {
  await NotificationService.markAllRead(req.user.id);
  success(res, null, 'Toutes les notifications marquées comme lues');
});

const saveFcmToken = asyncHandler(async (req, res) => {
  await NotificationService.saveFcmToken(req.user.id, req.body.fcm_token);
  success(res, null, 'Token FCM enregistré');
});

const remove = asyncHandler(async (req, res) => {
  await NotificationService.delete(parseInt(req.params.id), req.user.id);
  success(res, null, 'Notification supprimée');
});

module.exports = { getAll, markRead, markAllRead, saveFcmToken, remove };
