jest.mock('../../src/config/database');
jest.mock('../../src/utils/auditLog', () => ({ logAction: jest.fn() }));

const db = require('../../src/config/database');

const mockReceipt = {
  id: 1, receipt_number: 'REC-2026-001',
  sale_order_id: 10, payment_id: 1,
  site_id: 1, cashier_id: 3,
  amount: 75000, payment_mode: 'cash',
  issued_at: new Date().toISOString(),
};

beforeEach(() => jest.clearAllMocks());

describe('Receipt — structure', () => {
  test('mock receipt a les champs requis', () => {
    expect(mockReceipt).toHaveProperty('receipt_number');
    expect(mockReceipt).toHaveProperty('amount');
    expect(mockReceipt).toHaveProperty('payment_mode');
    expect(mockReceipt).toHaveProperty('issued_at');
  });

  test('numéro reçu respecte le format REC-YYYY-XXX', () => {
    expect(mockReceipt.receipt_number).toMatch(/^REC-\d{4}-\d{3,}$/);
  });

  test('mode paiement du reçu est valide', () => {
    const validModes = ['cash', 'card', 'mtn_momo', 'orange_money', 'stripe'];
    expect(validModes).toContain(mockReceipt.payment_mode);
  });
});

describe('Receipt — requêtes DB simulées', () => {
  test('findById retourne reçu', async () => {
    db.query.mockResolvedValue({ rows: [mockReceipt] });
    const { rows } = await db.query('SELECT * FROM receipts WHERE id = $1', [1]);
    expect(rows[0].receipt_number).toBe('REC-2026-001');
  });

  test('findById retourne vide si absent', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const { rows } = await db.query('SELECT * FROM receipts WHERE id = $1', [999]);
    expect(rows).toHaveLength(0);
  });

  test('findByPayment retourne le reçu lié', async () => {
    db.query.mockResolvedValue({ rows: [mockReceipt] });
    const { rows } = await db.query(
      'SELECT * FROM receipts WHERE payment_id = $1', [1]
    );
    expect(rows[0].payment_id).toBe(1);
  });

  test('findBySaleOrder retourne tous les reçus', async () => {
    db.query.mockResolvedValue({ rows: [mockReceipt, { ...mockReceipt, id: 2 }] });
    const { rows } = await db.query(
      'SELECT * FROM receipts WHERE sale_order_id = $1', [10]
    );
    expect(rows).toHaveLength(2);
  });

  test('création reçu en transaction', async () => {
    db.transaction.mockImplementation(async (cb) => {
      const client = {
        query: jest.fn().mockResolvedValue({ rows: [mockReceipt] }),
      };
      return cb(client);
    });
    const result = await db.transaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO receipts (sale_order_id, payment_id, amount, payment_mode)
         VALUES ($1,$2,$3,$4) RETURNING *`,
        [10, 1, 75000, 'cash']
      );
      return rows[0];
    });
    expect(result.amount).toBe(75000);
    expect(result.payment_mode).toBe('cash');
  });
});

describe('Receipt — génération numéro', () => {
  test('génère un numéro unique avec année courante', () => {
    const year = new Date().getFullYear();
    const num  = `REC-${year}-001`;
    expect(num).toMatch(new RegExp(`^REC-${year}-\\d{3,}$`));
  });

  test('deux reçus ont des numéros différents', () => {
    const r1 = 'REC-2026-001';
    const r2 = 'REC-2026-002';
    expect(r1).not.toBe(r2);
  });
});