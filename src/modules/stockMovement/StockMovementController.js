const asyncHandler = require('../../utils/asyncHandler');
const { success, created, paginated } = require('../../utils/ApiResponse');
const MovementService = require('./StockMovementService');

const getAll = asyncHandler(async (req, res) => {
  const { movements, pagination } = await MovementService.getAll(req.query);
  paginated(res, movements, pagination);
});

const getById = asyncHandler(async (req, res) => {
  const m = await MovementService.getById(Number.parseInt(req.params.id));
  success(res, m);
});

const getPending = asyncHandler(async (req, res) => {
  const list = await MovementService.getPending(req.query.site_id);
  success(res, list);
});

const createEntry = asyncHandler(async (req, res) => {
  const m = await MovementService.createEntry(req.body, req.user.id);
  created(res, m, 'Entrée enregistrée');
});

const createExit = asyncHandler(async (req, res) => {
  const m = await MovementService.createExit(req.body, req.user.id);
  created(res, m, 'Sortie enregistrée');
});

const createTransfer = asyncHandler(async (req, res) => {
  const result = await MovementService.createTransfer(req.body, req.user.id);
  created(res, result, 'Transfert effectué');
});

const validate = asyncHandler(async (req, res) => {
  const m = await MovementService.validate(Number.parseInt(req.params.id), req.user.id);
  success(res, m, 'Mouvement validé');
});

const reject = asyncHandler(async (req, res) => {
  const m = await MovementService.reject(
    Number.parseInt(req.params.id), req.body.rejection_reason, req.user.id
  );
  success(res, m, 'Mouvement rejeté');
});

module.exports = { getAll, getById, getPending, createEntry, createExit, createTransfer, validate, reject };
