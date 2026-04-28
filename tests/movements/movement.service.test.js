jest.mock('../../src/config/database');
const db = require('../../src/config/database');
const MovementService = require('../../src/modules/stockMovement/StockMovementService');

const mockMovement = {
  id: 1, type: 'entry', product_id: 1, site_id: 1,
  quantity: 10, status: 'pending', user_id: 1,
  product_name: 'Câble HDMI', site_name: 'Siège',
};

beforeEach(() => jest.clearAllMocks());

describe('MovementService.createEntry', () => {
  test('entrée créée avec statut pending', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })       // INSERT RETURNING id
      .mockResolvedValueOnce({ rows: [mockMovement] });    // findById

    const m = await MovementService.createEntry(
      { product_id: 1, site_id: 1, quantity: 10, motif: 'Test' }, 1
    );
    expect(m.type).toBe('entry');
    expect(m.status).toBe('pending');
  });
});

describe('MovementService.createExit', () => {
  test('stock insuffisant → erreur 400', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, product_id: 1, site_id: 1, quantity: 5 }] });

    await expect(
      MovementService.createExit({ product_id: 1, site_id: 1, quantity: 20 }, 1)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test('stock suffisant → sortie créée', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 1, product_id: 1, site_id: 1, quantity: 50 }] }) // findByProductAndSite
      .mockResolvedValueOnce({ rows: [{ id: 2 }] })                                           // INSERT
      .mockResolvedValueOnce({ rows: [{ ...mockMovement, type: 'exit' }] });                  // findById

    const m = await MovementService.createExit(
      { product_id: 1, site_id: 1, quantity: 10 }, 1
    );
    expect(m.type).toBe('exit');
  });
});

describe('MovementService.validate', () => {
  test('mouvement non pending → erreur 400', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ ...mockMovement, status: 'validated' }] });

    await expect(MovementService.validate(1, 1)).rejects.toMatchObject({ statusCode: 400 });
  });

  test('validation entrée → stock mis à jour', async () => {
    // getById initial
    db.query.mockResolvedValueOnce({ rows: [mockMovement] });

    db.transaction.mockImplementation(async (cb) => {
      const client = { query: jest.fn().mockResolvedValue({ rows: [] }) };
      return cb(client);
    });

    // auditLog + findById final
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ ...mockMovement, status: 'validated' }] });

    const m = await MovementService.validate(1, 1);
    expect(m.status).toBe('validated');
  });
});

describe('MovementService.reject', () => {
  test('rejet avec motif → status rejected', async () => {
    // getById → pending
    db.query.mockResolvedValueOnce({ rows: [mockMovement] });
    // updateStatus
    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    // auditLog
    db.query.mockResolvedValueOnce({ rows: [] });
    // findById final
    db.query.mockResolvedValueOnce({ rows: [{ ...mockMovement, status: 'rejected' }] });

    const m = await MovementService.reject(1, 'Erreur de saisie', 1);
    expect(m.status).toBe('rejected');
  });
});
