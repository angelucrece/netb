jest.mock('../../src/config/database');
jest.mock('../../src/modules/cash/CashRepository');
jest.mock('../../src/utils/auditLog',      () => ({ logAction: jest.fn() }));
jest.mock('../../src/utils/accessControl', () => ({
  assertSiteAccess:   jest.fn(),
  scopeFiltersToUser: jest.fn((filters) => filters),
}));
jest.mock('../../src/utils/businessRules', () => ({
  assertCommercialSite: jest.fn(),
}));

const CashRepository = require('../../src/modules/cash/CashRepository');
const CashService    = require('../../src/modules/cash/CashService');

const mockUser = {
  id: 3, role: { name: 'cashier' }, site_id: 1,
};

const mockSession = {
  id: 1, cashier_id: 3, site_id: 1,
  status: 'open', opening_balance: 50000,
};

const mockClosedSession = {
  ...mockSession, status: 'closed',
  closing_balance: 60000, expected_amount: 60000, variance_amount: 0,
};

beforeEach(() => jest.clearAllMocks());

describe('CashService.getSessions', () => {
  test('retourne sessions paginées', async () => {
    CashRepository.findAll.mockResolvedValue([mockSession]);
    CashRepository.count.mockResolvedValue(1);
    const result = await CashService.getSessions({ page: 1, limit: 20 }, mockUser);
    expect(result.sessions).toHaveLength(1);
    expect(result.pagination).toBeDefined();
  });
});

describe('CashService.getById', () => {
  test('session existante → retournée avec total paiements', async () => {
    CashRepository.findById.mockResolvedValue(mockSession);
    CashRepository.paymentTotal.mockResolvedValue(10000);
    const result = await CashService.getById(1, mockUser);
    expect(result.id).toBe(1);
    expect(result.payments_total).toBe(10000);
  });

  test('session inexistante → erreur 404', async () => {
    CashRepository.findById.mockResolvedValue(null);
    await expect(CashService.getById(999, mockUser))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('CashService.getCurrent', () => {
  test('session ouverte existante → retournée', async () => {
    CashRepository.findOpen.mockResolvedValue(mockSession);
    const result = await CashService.getCurrent(mockUser);
    expect(result.status).toBe('open');
  });

  test('utilisateur sans site → erreur 400', async () => {
    await expect(CashService.getCurrent({ id: 1, role: { name: 'cashier' } }))
      .rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('CashService.open', () => {
  test('ouverture réussie → session retournée', async () => {
    CashRepository.findOpen.mockResolvedValue(null);
    CashRepository.open.mockResolvedValue(mockSession);
    const result = await CashService.open(
      { site_id: 1, opening_balance: 50000 }, mockUser, '127.0.0.1'
    );
    expect(result.status).toBe('open');
    expect(CashRepository.open).toHaveBeenCalledTimes(1);
  });

  test('session déjà ouverte → erreur 409', async () => {
    CashRepository.findOpen.mockResolvedValue(mockSession);
    await expect(CashService.open(
      { site_id: 1, opening_balance: 0 }, mockUser, '127.0.0.1'
    )).rejects.toMatchObject({ statusCode: 409 });
  });

  test('sans site_id → erreur 400', async () => {
    const userNoSite = { ...mockUser, site_id: null };
    await expect(CashService.open({ opening_balance: 0 }, userNoSite, '127.0.0.1'))
      .rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('CashService.close', () => {
  test('fermeture réussie → session fermée retournée', async () => {
    CashRepository.findById.mockResolvedValue(mockSession);
    CashRepository.paymentTotal.mockResolvedValue(10000);
    CashRepository.close.mockResolvedValue(mockClosedSession);
    const result = await CashService.close(
      1, { closing_balance: 60000 }, mockUser, '127.0.0.1'
    );
    expect(result.status).toBe('closed');
    expect(result.payments_total).toBe(10000);
  });

  test('session déjà fermée → erreur 400', async () => {
    CashRepository.findById.mockResolvedValue(mockClosedSession);
    CashRepository.paymentTotal.mockResolvedValue(0);
    await expect(CashService.close(1, { closing_balance: 0 }, mockUser, '127.0.0.1'))
      .rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('CashService.getPayments', () => {
  test('retourne paiements paginés', async () => {
    CashRepository.findPayments.mockResolvedValue([{ id: 1, amount: 5000 }]);
    CashRepository.countPayments.mockResolvedValue(1);
    const result = await CashService.getPayments({ page: 1, limit: 20 }, mockUser);
    expect(result.payments).toHaveLength(1);
  });
});