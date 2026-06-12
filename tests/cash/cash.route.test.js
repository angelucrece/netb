jest.mock('../../src/config/database');
jest.mock('../../src/modules/cash/CashService');
jest.mock('../../src/utils/auditLog',      () => ({ logAction: jest.fn() }));
jest.mock('../../src/utils/accessControl', () => ({
  assertSiteAccess:   jest.fn(),
  scopeFiltersToUser: jest.fn((f) => f),
}));
jest.mock('../../src/utils/businessRules', () => ({
  assertCommercialSite: jest.fn(),
}));
jest.mock('../../src/middleware/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 3, role: { name: 'cashier' }, site_id: 1 };
    next();
  },
  authorize: (..._roles) => (_req, _res, next) => next(),
}));
jest.mock('../../src/middleware/validation', () => ({
  validate: () => (_req, _res, next) => next(),
}));

const request     = require('supertest');
const { makeApp } = require('../helpers/testApp');
const CashService = require('../../src/modules/cash/CashService');
const router      = require('../../src/modules/cash/CashRoute');

const app = makeApp('cash', router);

const mockSession = {
  id: 1, status: 'open', opening_balance: 50000,
  site_id: 1, payments_total: 0,
};
const mockClosed = { ...mockSession, status: 'closed', closing_balance: 60000 };

beforeEach(() => jest.clearAllMocks());

// ── GET /sessions ────────────────────────────────────────────
describe('GET /api/v1/cash/sessions', () => {
  test('200 — liste sessions', async () => {
    CashService.getSessions.mockResolvedValue({
      sessions: [mockSession],
      pagination: { page: 1, total: 1 },
    });
    const res = await request(app).get('/api/v1/cash/sessions');
    expect(res.status).toBe(200);
  });
});

// ── GET /sessions/:id ────────────────────────────────────────
describe('GET /api/v1/cash/sessions/:id', () => {
  test('200 — session retournée', async () => {
    CashService.getById.mockResolvedValue(mockSession);
    const res = await request(app).get('/api/v1/cash/sessions/1');
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(1);
  });

  test('404 — session inexistante', async () => {
    CashService.getById.mockRejectedValue(
      Object.assign(new Error('Session introuvable'), { statusCode: 404 })
    );
    const res = await request(app).get('/api/v1/cash/sessions/999');
    expect(res.status).toBe(404);
  });
});

// ── GET /sessions/current ────────────────────────────────────
describe('GET /api/v1/cash/sessions/current', () => {
  test('200 — session courante', async () => {
    CashService.getCurrent.mockResolvedValue(mockSession);
    const res = await request(app).get('/api/v1/cash/sessions/current');
    expect(res.status).toBe(200);
  });
});

// ── POST /sessions/open ──────────────────────────────────────
describe('POST /api/v1/cash/sessions/open', () => {
  test('201 — session ouverte', async () => {
    CashService.open.mockResolvedValue(mockSession);
    const res = await request(app)
      .post('/api/v1/cash/sessions/open')
      .send({ site_id: 1, opening_balance: 50000 });
    expect(res.status).toBe(201);
  });

  test('409 — session déjà ouverte', async () => {
    CashService.open.mockRejectedValue(
      Object.assign(new Error('Session deja ouverte'), { statusCode: 409 })
    );
    const res = await request(app)
      .post('/api/v1/cash/sessions/open')
      .send({ site_id: 1, opening_balance: 0 });
    expect(res.status).toBe(409);
  });
});

// ── POST /sessions/:id/close ─────────────────────────────────
describe('POST /api/v1/cash/sessions/:id/close', () => {
  test('200 — session fermée', async () => {
    CashService.close.mockResolvedValue(mockClosed);
    const res = await request(app)
      .post('/api/v1/cash/sessions/1/close')
      .send({ closing_balance: 60000 });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('closed');
  });
});

// ── GET /payments ────────────────────────────────────────────
describe('GET /api/v1/cash/payments', () => {
  test('200 — liste paiements', async () => {
    CashService.getPayments.mockResolvedValue({
      payments: [{ id: 1, amount: 5000 }],
      pagination: { page: 1, total: 1 },
    });
    const res = await request(app).get('/api/v1/cash/payments');
    expect(res.status).toBe(200);
  });
});