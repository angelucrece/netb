// const CashRepository = require('./CashRepository');
// const ApiError = require('../../utils/ApiError');
// const paginate = require('../../utils/paginate');
// const { logAction } = require('../../utils/auditLog');

// class CashService {
//   //fomction pour recuperer les sessions de caisse avec pagination et filtres
//   static async getSessions(filters) {
//     const { page = 1, limit = 20, ...rest } = filters;
//     const pg = paginate(page, limit, 0);
//     const [rows, total] = await Promise.all([
//       CashRepository.findAll({ ...rest, limit: pg.limit, offset: pg.offset }),
//       CashRepository.count(rest),
//     ]);
//     return { sessions: rows, pagination: paginate(page, limit, total) };
//   }

//   //fonction pour recuperer une session de caisse par son id avec le total des paiements associes
//   static async getById(id) {
//     const session = await CashRepository.findById(id);
//     if (!session) throw ApiError.notFound('Session de caisse introuvable');
//     const payments_total = await CashRepository.paymentTotal(id);
//     return { ...session, payments_total };
//   }

//   static async getCurrent(user) {
//     if (!user.site_id) throw ApiError.badRequest('Utilisateur sans site affecte');
//     return await CashRepository.findOpen(user.id, user.site_id);
//   }

//   static async open(data, user, ip) {
//     // Ouverture de caisse :
//     // un caissier ouvre une session pour enregistrer les paiements sur place
//     // ou les paiements mobile money encaisses au comptoir. Une session ouverte
//     // permet ensuite de rattacher les paiements a une cloture de caisse.
//     const siteId = data.site_id || user.site_id;
//     if (!siteId) throw ApiError.badRequest('Site requis pour ouvrir la caisse');

//     const existing = await CashRepository.findOpen(user.id, siteId);
//     if (existing) throw ApiError.conflict('Une session de caisse est deja ouverte');

//     const session = await CashRepository.open({
//       cashier_id: user.id,
//       site_id: siteId,
//       opening_balance: data.opening_balance || 0,
//       notes: data.notes,
//     });

//     await logAction({ userId: user.id, action: 'OPEN_CASH_SESSION', entityType: 'cash_session', entityId: session.id, newValue: session, ip });
//     return session;
//   }

//   static async close(id, data, userId, ip) {
//     // Cloture de caisse :
//     // le backend calcule le montant attendu = fond d'ouverture + paiements
//     // rattaches a la session. La difference avec le montant declare permet de
//     // detecter un ecart de caisse.
//     const session = await this.getById(id);
//     if (session.status !== 'open') throw ApiError.badRequest('Session deja fermee');

//     const paymentsTotal = await CashRepository.paymentTotal(id);
//     const opening = Number(session.opening_balance || 0);
//     const expected = opening + paymentsTotal;
//     const closing = Number(data.closing_balance);
//     const closed = await CashRepository.close(id, {
//       closing_balance: closing,
//       expected_amount: expected,
//       variance_amount: closing - expected,
//       notes: data.notes,
//     });

//     await logAction({ userId, action: 'CLOSE_CASH_SESSION', entityType: 'cash_session', entityId: id, newValue: closed, ip });
//     return { ...closed, payments_total: paymentsTotal };
//   }

//   //
//   static async getPayments(filters) {
//     const { page = 1, limit = 20, ...rest } = filters;
//     const pg = paginate(page, limit, 0);
//     const [rows, total] = await Promise.all([
//       CashRepository.findPayments({ ...rest, limit: pg.limit, offset: pg.offset }),
//       CashRepository.countPayments(rest),
//     ]);
//     return { payments: rows, pagination: paginate(page, limit, total) };
//   }
// }

// module.exports = CashService;

const CashRepository = require('./CashRepository');
const ApiError = require('../../utils/ApiError');
const paginate = require('../../utils/paginate');
const { logAction } = require('../../utils/auditLog');
const { assertSiteAccess, scopeFiltersToUser } = require('../../utils/accessControl');
const { assertCommercialSite } = require('../../utils/businessRules');

class CashService {
  static async getSessions(filters, user) {
    const { page = 1, limit = 20, ...rest } = filters;
    const scoped = user?.role ? scopeFiltersToUser(rest, user) : rest;
    const pg = paginate(page, limit, 0);
    const [rows, total] = await Promise.all([
      CashRepository.findAll({ ...scoped, limit: pg.limit, offset: pg.offset }),
      CashRepository.count(scoped),
    ]);
    return { sessions: rows, pagination: paginate(page, limit, total) };
  }

  static async getById(id, user) {
    const session = await CashRepository.findById(id);
    if (!session) throw ApiError.notFound('Session de caisse introuvable');
    if (user?.role) assertSiteAccess(user, session.site_id);
    const payments_total = await CashRepository.paymentTotal(id);
    return { ...session, payments_total };
  }

  static async getCurrent(user) {
    if (!user.site_id) throw ApiError.badRequest('Utilisateur sans site affecte');
    return await CashRepository.findOpen(user.id, user.site_id);
  }

  static async open(data, user, ip) {
    const siteId = data.site_id || user.site_id;
    if (!siteId) throw ApiError.badRequest('Site requis pour ouvrir la caisse');
    assertSiteAccess(user, siteId);
    await assertCommercialSite(siteId);

    const existing = await CashRepository.findOpen(user.id, siteId);
    if (existing) throw ApiError.conflict('Une session de caisse est deja ouverte');

    const session = await CashRepository.open({
      cashier_id: user.id,
      site_id: siteId,
      opening_balance: data.opening_balance || 0,
      notes: data.notes,
    });

    await logAction({ userId: user.id, action: 'OPEN_CASH_SESSION', entityType: 'cash_session', entityId: session.id, newValue: session, ip });
    return session;
  }

  static async close(id, data, user, ip) {
    const session = await this.getById(id, user);
    if (session.status !== 'open') throw ApiError.badRequest('Session deja fermee');

    const paymentsTotal = await CashRepository.paymentTotal(id);
    const opening = Number(session.opening_balance || 0);
    const expected = opening + paymentsTotal;
    const closing = Number(data.closing_balance);
    const closed = await CashRepository.close(id, {
      closing_balance: closing,
      expected_amount: expected,
      variance_amount: closing - expected,
      notes: data.notes,
    });

    await logAction({ userId: user.id, action: 'CLOSE_CASH_SESSION', entityType: 'cash_session', entityId: id, newValue: closed, ip });
    return { ...closed, payments_total: paymentsTotal };
  }

  static async getPayments(filters, user) {
    const { page = 1, limit = 20, ...rest } = filters;
    const scoped = user?.role ? scopeFiltersToUser(rest, user) : rest;
    const pg = paginate(page, limit, 0);
    const [rows, total] = await Promise.all([
      CashRepository.findPayments({ ...scoped, limit: pg.limit, offset: pg.offset }),
      CashRepository.countPayments(scoped),
    ]);
    return { payments: rows, pagination: paginate(page, limit, total) };
  }
}

module.exports = CashService;
