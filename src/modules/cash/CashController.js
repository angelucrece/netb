const asyncHandler = require('../../utils/asyncHandler');
const { success, created, paginated } = require('../../utils/ApiResponse');
const CashService = require('./CashService');

const getSessions = asyncHandler(async (req, res) => {
  const { sessions, pagination } = await CashService.getSessions(req.query);
  paginated(res, sessions, pagination);
});

const getById = asyncHandler(async (req, res) => {
  const session = await CashService.getById(Number.parseInt(req.params.id, 10));
  success(res, session);
});

const getCurrent = asyncHandler(async (req, res) => {
  const session = await CashService.getCurrent(req.user);
  success(res, session);
});

const open = asyncHandler(async (req, res) => {
  const session = await CashService.open(req.body, req.user, req.ip);
  created(res, session, 'Session de caisse ouverte');
});

const close = asyncHandler(async (req, res) => {
  const session = await CashService.close(Number.parseInt(req.params.id, 10), req.body, req.user.id, req.ip);
  success(res, session, 'Session de caisse fermee');
});

const getPayments = asyncHandler(async (req, res) => {
  const { payments, pagination } = await CashService.getPayments(req.query);
  paginated(res, payments, pagination);
});

module.exports = { getSessions, getById, getCurrent, open, close, getPayments };
