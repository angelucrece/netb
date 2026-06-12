// const ClientRepository = require('./ClientRepository');
// const ApiError = require('../../utils/ApiError');
// const paginate = require('../../utils/paginate');
// const { logAction } = require('../../utils/auditLog');

// class ClientService {
//   static async getAll(filters) {
//     const { page = 1, limit = 20, ...rest } = filters;
//     const pg = paginate(page, limit, 0);
//     const [rows, total] = await Promise.all([
//       ClientRepository.findAll({ ...rest, limit: pg.limit, offset: pg.offset }),
//       ClientRepository.count(rest),
//     ]);
//     return { clients: rows, pagination: paginate(page, limit, total) };
//   }

//   static async getById(id) {
//     const client = await ClientRepository.findById(id);
//     if (!client) throw ApiError.notFound('Client introuvable');
//     return client;
//   }

//   static async create(data, userId, ip) {
//     const client = await ClientRepository.create(data);
//     await logAction({ userId, action: 'CREATE_CLIENT', entityType: 'client', entityId: client.id, newValue: client, ip });
//     return client;
//   }

//   static async update(id, data, userId, ip) {
//     const old = await this.getById(id);
//     const client = await ClientRepository.update(id, data);
//     await logAction({ userId, action: 'UPDATE_CLIENT', entityType: 'client', entityId: id, oldValue: old, newValue: client, ip });
//     return client;
//   }

//   static async toggle(id, active, userId, ip) {
//     await this.getById(id);
//     const client = await ClientRepository.setActive(id, active);
//     await logAction({ userId, action: 'TOGGLE_CLIENT', entityType: 'client', entityId: id, newValue: { active }, ip });
//     return client;
//   }

//   static async delete(id, userId, ip) {
//     await this.toggle(id, false, userId, ip);
//   }
// }

// module.exports = ClientService;


const ClientRepository = require('./ClientRepository');
const ApiError = require('../../utils/ApiError');
const paginate = require('../../utils/paginate');
const { logAction } = require('../../utils/auditLog');
const { normalizePaymentTerms } = require('../../utils/businessRules');

class ClientService {
  static async getAll(filters) {
    const { page = 1, limit = 20, ...rest } = filters;
    const pg = paginate(page, limit, 0);
    const [rows, total] = await Promise.all([
      ClientRepository.findAll({ ...rest, limit: pg.limit, offset: pg.offset }),
      ClientRepository.count(rest),
    ]);
    return { clients: rows, pagination: paginate(page, limit, total) };
  }

  static async getById(id) {
    const client = await ClientRepository.findById(id);
    if (!client) throw ApiError.notFound('Client introuvable');
    return client;
  }

  static async create(data, userId, ip) {
    const normalized = {
      ...data,
      payment_terms_days: normalizePaymentTerms(data.type || 'occasional', data.payment_terms_days),
    };
    const client = await ClientRepository.create(normalized);
    await logAction({ userId, action: 'CREATE_CLIENT', entityType: 'client', entityId: client.id, newValue: client, ip });
    return client;
  }

  static async update(id, data, userId, ip) {
    const old = await this.getById(id);
    const normalized = {
      ...data,
      payment_terms_days: normalizePaymentTerms(data.type || old.type || 'occasional', data.payment_terms_days),
    };
    const client = await ClientRepository.update(id, normalized);
    await logAction({ userId, action: 'UPDATE_CLIENT', entityType: 'client', entityId: id, oldValue: old, newValue: client, ip });
    return client;
  }

  static async toggle(id, active, userId, ip) {
    await this.getById(id);
    const client = await ClientRepository.setActive(id, active);
    await logAction({ userId, action: 'TOGGLE_CLIENT', entityType: 'client', entityId: id, newValue: { active }, ip });
    return client;
  }

  static async delete(id, userId, ip) {
    await this.toggle(id, false, userId, ip);
  }
}

module.exports = ClientService;
