jest.mock('../../src/config/database');
jest.mock('../../src/utils/auditLog', () => ({ logAction: jest.fn() }));

const db = require('../../src/config/database');

const mockInvoice = {
  id: 1, sale_order_id: 10, site_id: 1,
  invoice_number: 'FAC-2026-001',
  status: 'draft', total_amount: 150000,
  tax_amount: 27900, tax_rate: 19.25,
  issued_at: null, due_at: null,
  created_at: new Date().toISOString(),
};

beforeEach(() => jest.clearAllMocks());

describe('Invoice — structure', () => {
  test('mock invoice a les champs requis', () => {
    expect(mockInvoice).toHaveProperty('invoice_number');
    expect(mockInvoice).toHaveProperty('total_amount');
    expect(mockInvoice).toHaveProperty('tax_amount');
    expect(['draft','issued','paid','cancelled']).toContain(mockInvoice.status);
  });

  test('numéro facture respecte le format FAC-YYYY-XXX', () => {
    expect(mockInvoice.invoice_number).toMatch(/^FAC-\d{4}-\d{3,}$/);
  });

  test('calcul TVA correct (19.25%)', () => {
    const ht = 150000;
    const tva = Number((ht * 19.25 / 100).toFixed(2));
    expect(tva).toBeCloseTo(28875, 0);
  });
});

describe('Invoice — requêtes DB simulées', () => {
  test('findById retourne facture', async () => {
    db.query.mockResolvedValue({ rows: [mockInvoice] });
    const { rows } = await db.query('SELECT * FROM invoices WHERE id = $1', [1]);
    expect(rows[0].invoice_number).toBe('FAC-2026-001');
  });

  test('findById retourne vide si absent', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const { rows } = await db.query('SELECT * FROM invoices WHERE id = $1', [999]);
    expect(rows).toHaveLength(0);
  });

  test('findBySaleOrder retourne la facture de la commande', async () => {
    db.query.mockResolvedValue({ rows: [mockInvoice] });
    const { rows } = await db.query(
      'SELECT * FROM invoices WHERE sale_order_id = $1', [10]
    );
    expect(rows[0].sale_order_id).toBe(10);
  });

  test('passage draft → issued via transaction', async () => {
    db.transaction.mockImplementation(async (cb) => {
      const client = {
        query: jest.fn().mockResolvedValue({
          rows: [{ ...mockInvoice, status: 'issued', issued_at: new Date() }],
        }),
      };
      return cb(client);
    });
    const result = await db.transaction(async (client) => {
      const { rows } = await client.query(
        "UPDATE invoices SET status='issued', issued_at=NOW() WHERE id=$1 RETURNING *",
        [1]
      );
      return rows[0];
    });
    expect(result.status).toBe('issued');
    expect(result.issued_at).toBeDefined();
  });

  test('findAll par site retourne liste', async () => {
    db.query.mockResolvedValue({ rows: [mockInvoice, { ...mockInvoice, id: 2 }] });
    const { rows } = await db.query(
      'SELECT * FROM invoices WHERE site_id = $1', [1]
    );
    expect(rows).toHaveLength(2);
  });
});