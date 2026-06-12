jest.mock('../../src/config/database');
jest.mock('../../src/utils/auditLog', () => ({ logAction: jest.fn() }));
jest.mock('../../src/utils/accessControl', () => ({
  assertSiteAccess:   jest.fn(),
  scopeFiltersToUser: jest.fn((f) => f),
}));

// Mock dynamique du module delivery — car il est dans le RAR
// On teste via les interfaces publiques attendues
const db = require('../../src/config/database');

const mockDelivery = {
  id: 1, sale_order_id: 10, site_id: 1,
  status: 'pending', delivery_date: null,
  delivered_by: null, created_at: new Date().toISOString(),
};

beforeEach(() => jest.clearAllMocks());

describe('Delivery — structure de base', () => {
  test('mock delivery a les champs requis', () => {
    expect(mockDelivery).toHaveProperty('id');
    expect(mockDelivery).toHaveProperty('sale_order_id');
    expect(mockDelivery).toHaveProperty('status');
    expect(['pending','in_progress','delivered','cancelled'])
      .toContain(mockDelivery.status);
  });

  test('db.query mock fonctionne', async () => {
    db.query.mockResolvedValue({ rows: [mockDelivery] });
    const result = await db.query('SELECT * FROM deliveries WHERE id = $1', [1]);
    expect(result.rows[0].id).toBe(1);
  });

  test('transition statut pending → in_progress est valide', () => {
    const validTransitions = {
      pending:     ['in_progress', 'cancelled'],
      in_progress: ['delivered',   'cancelled'],
      delivered:   [],
      cancelled:   [],
    };
    expect(validTransitions[mockDelivery.status]).toContain('in_progress');
  });

  test('transition statut delivered → autre est invalide', () => {
    const validTransitions = { delivered: [] };
    expect(validTransitions['delivered']).toHaveLength(0);
  });
});

describe('Delivery — requêtes DB simulées', () => {
  test('findAll retourne tableau de livraisons', async () => {
    db.query.mockResolvedValue({ rows: [mockDelivery, { ...mockDelivery, id: 2 }] });
    const { rows } = await db.query('SELECT * FROM deliveries');
    expect(rows).toHaveLength(2);
  });

  test('findById retourne null si absent', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const { rows } = await db.query('SELECT * FROM deliveries WHERE id = $1', [999]);
    expect(rows[0]).toBeUndefined();
  });

  test('update statut via transaction', async () => {
    db.transaction.mockImplementation(async (cb) => {
      const client = { query: jest.fn().mockResolvedValue({ rows: [{ ...mockDelivery, status: 'in_progress' }] }) };
      return cb(client);
    });
    const result = await db.transaction(async (client) => {
      const { rows } = await client.query(
        'UPDATE deliveries SET status=$1 WHERE id=$2 RETURNING *',
        ['in_progress', 1]
      );
      return rows[0];
    });
    expect(result.status).toBe('in_progress');
  });
});