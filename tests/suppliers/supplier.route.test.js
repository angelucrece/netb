jest.mock('../../src/config/database');
jest.mock('../../src/modules/suppliers/SupplierService');
jest.mock('../../src/utils/auditLog', () => ({ logAction: jest.fn() }));
jest.mock('../../src/middleware/auth', () => ({
  authenticate: (req, res, next) => { req.user = { id: 1, role: { name: 'admin' }, site_id: 1 }; next(); },
  authorize:    (..._roles) => (_req, _res, next) => next(),
}));
jest.mock('../../src/middleware/validation', () => ({
  validate: () => (_req, _res, next) => next(),
}));

const request         = require('supertest');
const { makeApp }     = require('../helpers/testApp');
const SupplierService = require('../../src/modules/suppliers/SupplierService');
const router          = require('../../src/modules/suppliers/SupplierRoute');

const app = makeApp('suppliers', router);

const mockSupplier = {
  id: 1, name: 'Fournisseur Central',
  phone: '+237690000001', city: 'Douala', active: true,
};

beforeEach(() => jest.clearAllMocks());

describe('GET /api/v1/suppliers', () => {
  test('200 — retourne liste paginée', async () => {
    SupplierService.getAll.mockResolvedValue({
      suppliers: [mockSupplier],
      pagination: { page: 1, limit: 20, total: 1 },
    });
    const res = await request(app).get('/api/v1/suppliers');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('GET /api/v1/suppliers/:id', () => {
  test('200 — fournisseur existant', async () => {
    SupplierService.getById.mockResolvedValue(mockSupplier);
    const res = await request(app).get('/api/v1/suppliers/1');
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(1);
  });

  test('404 — fournisseur inexistant', async () => {
    SupplierService.getById.mockRejectedValue({ statusCode: 404, message: 'Fournisseur introuvable' });
    const res = await request(app).get('/api/v1/suppliers/999');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/suppliers', () => {
  test('201 — fournisseur créé', async () => {
    SupplierService.create.mockResolvedValue(mockSupplier);
    const res = await request(app)
      .post('/api/v1/suppliers')
      .send({ name: 'Fournisseur Central', city: 'Douala' });
    expect(res.status).toBe(201);
  });
});

describe('PUT /api/v1/suppliers/:id', () => {
  test('200 — fournisseur mis à jour', async () => {
    SupplierService.update.mockResolvedValue({ ...mockSupplier, name: 'Modifié' });
    const res = await request(app)
      .put('/api/v1/suppliers/1')
      .send({ name: 'Modifié' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Modifié');
  });
});

describe('PATCH /api/v1/suppliers/:id/toggle', () => {
  test('200 — statut modifié', async () => {
    SupplierService.toggle.mockResolvedValue({ ...mockSupplier, active: false });
    const res = await request(app)
      .patch('/api/v1/suppliers/1/toggle')
      .send({ active: false });
    expect(res.status).toBe(200);
  });
});