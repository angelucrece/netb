const AuditLogRepository = require('./AuditLogRepository');
const ApiError = require('../../utils/ApiError');
const paginate = require('../../utils/paginate');

class AuditLogService {

  static async getLogs(filters) {
    const { page = 1, limit = 50, ...rest } = filters;
    const pg = paginate(page, limit, 0);

    const [rows, total] = await Promise.all([
      AuditLogRepository.findAll({ ...rest, limit: pg.limit, offset: pg.offset }),
      AuditLogRepository.count(rest),
    ]);

    return { logs: rows, pagination: paginate(page, limit, total) };
  }

  static async getById(id) {
    const log = await AuditLogRepository.findById(id);
    if (!log) throw ApiError.notFound('Log introuvable');
    return log;
  }

  static async getSummary(filters) {
    return await AuditLogRepository.getSummary(filters);
  }
}

module.exports = AuditLogService;
