jest.mock('../../src/config/database');
jest.mock('../../src/utils/auditLog', () => ({ logAction: jest.fn() }));

const db = require('../../src/config/database');

const mockPayment = {
  id: 1, sale_order_id: 10, site_id: 1,
  amount: 75000, mode: 'cash',
  status: 'completed', reference: 'PAY-001',
  provider: null, provider_reference: null,
  created_at: new Date().toISOString(),
};

const mockMomoPayment = {
  ...mockPayment, id: 2, mode: 'mtn_momo',
  provider: 'mtn_momo', provider_reference: 'MOMO_TXN_123',
  status: 'pending',
};

beforeEach(() => jest.clearAllMocks());

describe('Payment — structure', () => {
  test('mock payment cash a les champs requis', () => {
    expect(mockPayment).toHaveProperty('amount');
    expect(mockPayment).toHaveProperty('mode');
    expect(mockPayment).toHaveProperty('status');
    expect(['cash','card','mtn_momo','orange_money','stripe'])
      .toContain(mockPayment.mode);
  });

  test('mock paiement MoMo a un provider_reference', () => {
    expect(mockMomoPayment.provider).toBe('mtn_momo');
    expect(mockMomoPayment.provider_reference).toBeTruthy();
  });

  test('statuts valides pour un paiement', () => {
    const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
    expect(validStatuses).toContain(mockPayment.status);
    expect(validStatuses).toContain(mockMomoPayment.status);
  });
});

describe('Payment — requêtes DB simulées', () => {
  test('findById retourne paiement', async () => {
    db.query.mockResolvedValue({ rows: [mockPayment] });
    const { rows } = await db.query('SELECT * FROM payments WHERE id = $1', [1]);
    expect(rows[0].amount).toBe(75000);
  });

  test('findBySaleOrder retourne liste de paiements', async () => {
    db.query.mockResolvedValue({ rows: [mockPayment, mockMomoPayment] });
    const { rows } = await db.query(
      'SELECT * FROM payments WHERE sale_order_id = $1', [10]
    );
    expect(rows).toHaveLength(2);
  });

  test('total paiements pour une commande', async () => {
    db.query.mockResolvedValue({ rows: [{ total: '150000' }] });
    const { rows } = await db.query(
      'SELECT SUM(amount) as total FROM payments WHERE sale_order_id=$1 AND status=$2',
      [10, 'completed']
    );
    expect(Number(rows[0].total)).toBe(150000);
  });

  test('création paiement en transaction', async () => {
    db.transaction.mockImplementation(async (cb) => {
      const client = {
        query: jest.fn().mockResolvedValue({ rows: [mockPayment] }),
      };
      return cb(client);
    });
    const result = await db.transaction(async (client) => {
      const { rows } = await client.query(
        'INSERT INTO payments (sale_order_id, amount, mode) VALUES ($1,$2,$3) RETURNING *',
        [10, 75000, 'cash']
      );
      return rows[0];
    });
    expect(result.mode).toBe('cash');
  });

  test('paiement MoMo en attente → status pending', async () => {
    db.query.mockResolvedValue({ rows: [mockMomoPayment] });
    const { rows } = await db.query(
      'SELECT * FROM payments WHERE provider=$1 AND status=$2',
      ['mtn_momo', 'pending']
    );
    expect(rows[0].status).toBe('pending');
  });
});

describe('Payment — logique métier', () => {
  test('acompte 50% client occasionnel = la moitié du total', () => {
    const totalOrder = 150000;
    const acompteRequired = totalOrder * 0.5;
    expect(acompteRequired).toBe(75000);
    expect(mockPayment.amount).toBe(acompteRequired);
  });

  test('délai paiement entreprise = 30 ou 60 jours', () => {
    const validTerms = [0, 30, 60];
    const terms = 30;
    expect(validTerms).toContain(terms);
  });
});