const asyncHandler = require('../../utils/asyncHandler');
const { success, created, paginated } = require('../../utils/ApiResponse');
const InventoryService = require('./InventoryService');

const getSessions = asyncHandler(async (req, res) => {
  const { sessions, pagination } = await InventoryService.getSessions(req.query);
  paginated(res, sessions, pagination);
});

const getSessionById = asyncHandler(async (req, res) => {
  const s = await InventoryService.getSessionById(Number.parseInt(req.params.id));
  success(res, s);
});

const getActiveSession = asyncHandler(async (req, res) => {
  const s = await InventoryService.getActiveSession(req.user.site_id);
  success(res, s);
});

const startSession = asyncHandler(async (req, res) => {
  const s = await InventoryService.startSession(req.body, req.user.id);
  created(res, s, 'Session démarrée');
});

const addItem = asyncHandler(async (req, res) => {
  const item = await InventoryService.addItem(Number.parseInt(req.params.id), req.body, req.user.id);
  created(res, item, 'Article enregistré');
});

const updateItem = asyncHandler(async (req, res) => {
  const item = await InventoryService.updateItem(
    Number.parseInt(req.params.id), Number.parseInt(req.params.itemId), req.body.counted_qty, req.user.id
  );
  success(res, item, 'Article mis à jour');
});

const getGaps = asyncHandler(async (req, res) => {
  const gaps = await InventoryService.getGaps(Number.parseInt(req.params.id));
  success(res, gaps);
});

const validateSession = asyncHandler(async (req, res) => {
  const s = await InventoryService.validateSession(Number.parseInt(req.params.id), req.user.id);
  success(res, s, 'Session validée et stock régularisé');
});

const closeSession = asyncHandler(async (req, res) => {
  const s = await InventoryService.closeSession(Number.parseInt(req.params.id), req.user.id);
  success(res, s, 'Session fermée');
});

module.exports = { getSessions, getSessionById, getActiveSession, startSession, addItem, updateItem, getGaps, validateSession, closeSession };
