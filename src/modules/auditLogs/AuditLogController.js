const asyncHandler = require('../../utils/asyncHandler');
const { success, paginated } = require('../../utils/ApiResponse');
const AuditLogService = require('./AuditLogService');

const getAll = asyncHandler(async (req, res) => {
  const { logs, pagination } = await AuditLogService.getLogs(req.query);
  paginated(res, logs, pagination);
});

const getById = asyncHandler(async (req, res) => {
  const log = await AuditLogService.getById(Number.parseInt(req.params.id));
  success(res, log);
});

const getSummary = asyncHandler(async (req, res) => {
  const summary = await AuditLogService.getSummary(req.query);
  success(res, summary);
});

module.exports = { getAll, getById, getSummary };
