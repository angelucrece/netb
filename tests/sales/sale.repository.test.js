jest.mock('../../src/config/database');
const db             = require('../../src/config/database');
const SaleRepository = require('../../src/modules/sales/SaleRepository');

beforeEach(() => jest.clearAllMocks());

const mockOrder = {
  id: 1, site_id: 1, client_id: 1, status: 'draft',
  payment_status: 'pending', total_amount: 150000,
  channel: 'counter', created_at: new Date().toISOString(),
};

const mockClient = {
  query: jest.fn(),
};

describe('SaleRepository.findAll', () => {
  test('sans filtre → liste', async () => {
    db.query.mockResolvedValue({ rows: [mockOrder] });
    const result = await SaleRepository.findAll({ limit: 20, offset: 0 });
    expect(result).toHaveLength(1);
  });

  test('filtre par site_id', async () => {
    db.query.mockResolvedValue({ rows: [mockOrder] });
    const result = await SaleRepository.findAll({ site_id: 1, limit: 10, offset: 0 });
    expect(result[0].site_id).toBe(1);
  });

  test('filtre par status', async () => {
    db.query.mockResolvedValue({ rows: [mockOrder] });
    const result = await SaleRepository.findAll({ status: 'draft', limit: 10, offset: 0 });
    expect(result[0].status).toBe('draft');
  });

  test('filtre par client_id', async () => {
    db.query.mockResolvedValue({ rows: [mockOrder] });
    const result = await SaleRepository.findAll({ client_id: 1, limit: 10, offset: 0 });
    expect(result[0].client_id).toBe(1);
  });

  test('filtre par date_from et date_to', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const result = await SaleRepository.findAll({
      date_from: '2026-01-01', date_to: '2026-01-31', limit: 10, offset: 0,
    });
    expect(result).toHaveLength(0);
  });
});

describe('SaleRepository.count', () => {
  test('retourne le total', async () => {
    db.query.mockResolvedValue({ rows: [{ count: '12' }] });
    const result = await SaleRepository.count({});
    expect(Number(result)).toBe(12);
  });
});

describe('SaleRepository.findById', () => {
  test('commande existante → retournée avec items', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [mockOrder] })   // order
      .mockResolvedValueOnce({ rows: [] });             // items
    const result = await SaleRepository.findById(1);
    expect(result.id).toBe(1);
  });

  test('commande inexistante → falsy', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const result = await SaleRepository.findById(999);
    expect(result).toBeFalsy();
  });
});

describe('SaleRepository.create', () => {
  test('création via client transaction → retourne l\'id', async () => {
    mockClient.query.mockResolvedValue({ rows: [{ id: 1 }] });
    const result = await SaleRepository.create(
      { site_id: 1, client_id: 1, channel: 'counter', created_by: 1 },
      mockClient
    );
    expect(result).toBe(1);
    expect(mockClient.query).toHaveBeenCalledTimes(1);
  });
});

describe('SaleRepository.setStatus', () => {
  test('mise à jour statut → exécute UPDATE', async () => {
    mockClient.query.mockResolvedValue({ rows: [] });
    await SaleRepository.setStatus(1, 'confirmed', 1, mockClient);
    expect(mockClient.query).toHaveBeenCalledTimes(1);
    expect(mockClient.query.mock.calls[0][1]).toEqual(['confirmed', 1, 1]);
  });
});

describe('SaleRepository.salePaidTotal', () => {
  test('retourne total payé', async () => {
    mockClient.query.mockResolvedValue({ rows: [{ total: '75000' }] });
    const result = await SaleRepository.salePaidTotal(1, mockClient);
    expect(Number(result)).toBe(75000);
  });
});

describe('SaleRepository.listDeliveries', () => {
  test('retourne liste des livraisons', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 1, status: 'pending' }] });
    const result = await SaleRepository.listDeliveries({ limit: 10, offset: 0 });
    expect(result).toHaveLength(1);
  });
});

describe('SaleRepository.listInvoices', () => {
  test('retourne liste des factures', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 1, status: 'draft' }] });
    const result = await SaleRepository.listInvoices({ limit: 10, offset: 0 });
    expect(result).toHaveLength(1);
  });
});