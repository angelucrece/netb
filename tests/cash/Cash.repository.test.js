jest.mock('../../src/config/database');
const db             = require('../../src/config/database');
const CashRepository = require('../../src/modules/cash/CashRepository');

beforeEach(() => jest.clearAllMocks());

const session = {
  id: 1, cashier_id: 3, site_id: 1,
  status: 'open', opening_balance: 50000,
  created_at: new Date().toISOString(),
};

const closedSession = {
  ...session, status: 'closed',
  closing_balance: 60000, expected_amount: 60000, variance_amount: 0,
};

describe('CashRepository.findAll', () => {
  test('retourne liste des sessions', async () => {
    db.query.mockResolvedValue({ rows: [session] });
    const result = await CashRepository.findAll({ limit: 20, offset: 0 });
    expect(result).toHaveLength(1);
  });

  test('filtre par site_id', async () => {
    db.query.mockResolvedValue({ rows: [session] });
    const result = await CashRepository.findAll({ site_id: 1, limit: 10, offset: 0 });
    expect(result[0].site_id).toBe(1);
  });

  test('filtre par status', async () => {
    db.query.mockResolvedValue({ rows: [session] });
    const result = await CashRepository.findAll({ status: 'open', limit: 10, offset: 0 });
    expect(result[0].status).toBe('open');
  });

  test('filtre par cashier_id', async () => {
    db.query.mockResolvedValue({ rows: [session] });
    const result = await CashRepository.findAll({ cashier_id: 3, limit: 10, offset: 0 });
    expect(result[0].cashier_id).toBe(3);
  });
});

describe('CashRepository.count', () => {
  test('retourne le total', async () => {
    db.query.mockResolvedValue({ rows: [{ count: '2' }] });
    const result = await CashRepository.count({});
    expect(Number(result)).toBe(2);
  });
});

describe('CashRepository.findById', () => {
  test('session existante → retournée', async () => {
    db.query.mockResolvedValue({ rows: [session] });
    const result = await CashRepository.findById(1);
    expect(result.id).toBe(1);
  });

  test('session inexistante → falsy', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const result = await CashRepository.findById(999);
    expect(result).toBeFalsy();
  });
});

describe('CashRepository.findOpen', () => {
  test('session ouverte trouvée', async () => {
    db.query.mockResolvedValue({ rows: [session] });
    const result = await CashRepository.findOpen(3, 1);
    expect(result.status).toBe('open');
  });

  test('pas de session ouverte → falsy', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const result = await CashRepository.findOpen(3, 1);
    expect(result).toBeFalsy();
  });
});

describe('CashRepository.open', () => {
  test('ouvre une nouvelle session', async () => {
    db.query.mockResolvedValue({ rows: [session] });
    const result = await CashRepository.open({
      cashier_id: 3, site_id: 1, opening_balance: 50000, notes: '',
    });
    expect(result.status).toBe('open');
    expect(result.opening_balance).toBe(50000);
  });
});

describe('CashRepository.paymentTotal', () => {
  test('retourne le total des paiements', async () => {
    db.query.mockResolvedValue({ rows: [{ total: '15000' }] });
    const result = await CashRepository.paymentTotal(1);
    expect(Number(result)).toBe(15000);
  });

  test('aucun paiement → 0', async () => {
    db.query.mockResolvedValue({ rows: [{ total: null }] });
    const result = await CashRepository.paymentTotal(1);
    expect(Number(result) || 0).toBe(0);
  });
});

describe('CashRepository.close', () => {
  test('ferme la session avec solde', async () => {
    db.query.mockResolvedValue({ rows: [closedSession] });
    const result = await CashRepository.close(1, {
      closing_balance: 60000, expected_amount: 60000,
      variance_amount: 0, notes: '',
    });
    expect(result.status).toBe('closed');
    expect(result.closing_balance).toBe(60000);
  });
});

describe('CashRepository.findPayments', () => {
  test('retourne les paiements filtrés', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 1, amount: 5000, mode: 'cash' }] });
    const result = await CashRepository.findPayments({
      site_id: 1, limit: 20, offset: 0,
    });
    expect(result).toHaveLength(1);
    expect(result[0].mode).toBe('cash');
  });
});

describe('CashRepository.countPayments', () => {
  test('retourne le total des paiements', async () => {
    db.query.mockResolvedValue({ rows: [{ count: '10' }] });
    const result = await CashRepository.countPayments({ site_id: 1 });
    expect(Number(result)).toBe(10);
  });
});