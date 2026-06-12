jest.mock('../../src/config/database');
jest.mock('../../src/modules/clients/ClientService');
jest.mock('../../src/utils/auditLog',      () => ({ logAction: jest.fn() }));
jest.mock('../../src/utils/accessControl', () => ({
  assertSiteAccess:   jest.fn(),
  scopeFiltersToUser: jest.fn((f) => f),
}));
jest.mock('../../src/utils/businessRules', () => ({
  normalizePaymentTerms: jest.fn((t, d) => d ?? 0),
  assertCommercialSite:  jest.fn(),
}));
jest.mock('../../src/middleware/auth', () => ({
  authenticate: (req, res, next) => { req.user = { id: 1, role: { name: 'admin' }, site_id: 1 }; next(); },
  authorize:    (...roles) => (req, res, next) => next(),
}));
jest.mock('../../src/middleware/validation', () => ({
  validate: () => (req, res, next) => next(),
}));

const request      = require('supertest');
const { makeApp }  = require('../helpers/testApp');
const ClientService = require('../../src/modules/clients/ClientService');
const router        = require('../../src/modules/clients/ClientRoute');

const app = makeApp('clients', router);

const mockClient = {
  id: 1, type: 'company', name: 'Entreprise Alpha',
  email: 'alpha@test.cm', active: true,
};

beforeEach(() => jest.clearAllMocks());

describe('GET /api/v1/clients', () => {
  test('200 — retourne liste paginée', async () => {
    ClientService.getAll.mockResolvedValue({
      clients: [mockClient],
      pagination: { page: 1, limit: 20, total: 1 },
    });
    const res = await request(app).get('/api/v1/clients');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('GET /api/v1/clients/:id', () => {
  test('200 — client existant retourné', async () => {
    ClientService.getById.mockResolvedValue(mockClient);
    const res = await request(app).get('/api/v1/clients/1');
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(1);
  });

  test('404 — client inexistant', async () => {
    ClientService.getById.mockRejectedValue({ statusCode: 404, message: 'Client introuvable' });
    const res = await request(app).get('/api/v1/clients/999');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/clients', () => {
  test('201 — client créé', async () => {
    ClientService.create.mockResolvedValue(mockClient);
    const res = await request(app)
      .post('/api/v1/clients')
      .send({ type: 'company', name: 'Entreprise Alpha', email: 'alpha@test.cm' });
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe(1);
  });
});

describe('PUT /api/v1/clients/:id', () => {
  test('200 — client mis à jour', async () => {
    ClientService.update.mockResolvedValue({ ...mockClient, name: 'Alpha Modifié' });
    const res = await request(app)
      .put('/api/v1/clients/1')
      .send({ name: 'Alpha Modifié' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Alpha Modifié');
  });
});

describe('PATCH /api/v1/clients/:id/toggle', () => {
  test('200 — statut modifié', async () => {
    ClientService.toggle.mockResolvedValue({ ...mockClient, active: false });
    const res = await request(app)
      .patch('/api/v1/clients/1/toggle')
      .send({ active: false });
    expect(res.status).toBe(200);
    expect(res.body.data.active).toBe(false);
  });
});

describe('DELETE /api/v1/clients/:id', () => {
  test('200 — client désactivé', async () => {
    ClientService.delete.mockResolvedValue(undefined);
    const res = await request(app).delete('/api/v1/clients/1');
    expect(res.status).toBe(200);
  });
});