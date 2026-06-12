jest.mock('../../src/config/database');
const db                 = require('../../src/config/database');
const PurchaseRepository = require('../../src/modules/purchases/PurchaseRepository');

beforeEach(() => jest.clearAllMocks());

const mockOrder = {
  id: 1, site_id: 1, supplier_id: 1, status: 'draft',
  total_amount: 80000, created_at: new Date().toISOString(),
};

const mockClient = { query: jest.fn() };

describe('PurchaseRepository.findAll', () => {
  test('sans filtre → liste', async () => {
    db.query.mockResolvedValue({ rows: [mockOrder] });
    const result = await PurchaseRepository.findAll({ limit: 20, offset: 0 });
    expect(result).toHaveLength(1);
  });

  test('filtre par supplier_id', async () => {
    db.query.mockResolvedValue({ rows: [mockOrder] });
    const result = await PurchaseRepository.findAll({ supplier_id: 1, limit: 10, offset: 0 });
    expect(result[0].supplier_id).toBe(1);
  });

  test('filtre par status', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const result = await PurchaseRepository.findAll({ status: 'received', limit: 10, offset: 0 });
    expect(result).toHaveLength(0);
  });

  test('filtre par date_from', async () => {
    db.query.mockResolvedValue({ rows: [mockOrder] });
    const result = await PurchaseRepository.findAll({
      date_from: '2026-01-01', limit: 10, offset: 0,
    });
    expect(result).toHaveLength(1);
  });
});

describe('PurchaseRepository.count', () => {
  test('retourne le total', async () => {
    db.query.mockResolvedValue({ rows: [{ count: '7' }] });
    const result = await PurchaseRepository.count({});
    expect(Number(result)).toBe(7);
  });
});

describe('PurchaseRepository.findById', () => {
  test('commande existante → retournée avec items', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [mockOrder] })
      .mockResolvedValueOnce({ rows: [] });
    const result = await PurchaseRepository.findById(1);
    expect(result.id).toBe(1);
  });

  test('inexistante → falsy', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const result = await PurchaseRepository.findById(999);
    expect(result).toBeFalsy();
  });
});

describe('PurchaseRepository.create', () => {
  test('création via client transaction → retourne l\'id', async () => {
    mockClient.query.mockResolvedValue({ rows: [{ id: 1 }] });
    const result = await PurchaseRepository.create(
      { site_id: 1, supplier_id: 1, created_by: 1 },
      mockClient
    );
    expect(result).toBe(1);
  });
});

describe('PurchaseRepository.updateStatus', () => {
  test('mise à jour statut → exécute UPDATE', async () => {
    mockClient.query.mockResolvedValue({ rows: [] });
    await PurchaseRepository.updateStatus(1, 'validated', 1, mockClient);
    expect(mockClient.query).toHaveBeenCalledTimes(1);
    expect(mockClient.query.mock.calls[0][1]).toEqual(['validated', 1, 1]);
  });
});