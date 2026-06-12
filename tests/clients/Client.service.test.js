jest.mock('../../src/config/database');
jest.mock('../../src/modules/clients/ClientRepository');
jest.mock('../../src/utils/auditLog', () => ({ logAction: jest.fn() }));
jest.mock('../../src/utils/businessRules', () => ({
  normalizePaymentTerms: jest.fn((type, days) => days ?? 0),
  assertCommercialSite:  jest.fn(),
}));

const ClientRepository = require('../../src/modules/clients/ClientRepository');
const ClientService    = require('../../src/modules/clients/ClientService');

const mockClient = {
  id: 1, type: 'company', name: 'Entreprise Alpha SARL',
  email: 'alpha@test.cm', phone: '+237690000001',
  payment_terms_days: 30, active: true,
};

beforeEach(() => jest.clearAllMocks());

describe('ClientService.getAll', () => {
  test('retourne liste paginée', async () => {
    ClientRepository.findAll.mockResolvedValue([mockClient]);
    ClientRepository.count.mockResolvedValue(1);
    const result = await ClientService.getAll({ page: 1, limit: 20 });
    expect(result.clients).toHaveLength(1);
    expect(result.pagination).toBeDefined();
  });

  test('liste vide → pagination présente', async () => {
    ClientRepository.findAll.mockResolvedValue([]);
    ClientRepository.count.mockResolvedValue(0);
    const result = await ClientService.getAll({});
    expect(result.clients).toHaveLength(0);
  });
});

describe('ClientService.getById', () => {
  test('client existant → retourné', async () => {
    ClientRepository.findById.mockResolvedValue(mockClient);
    const client = await ClientService.getById(1);
    expect(client.id).toBe(1);
  });

  test('client inexistant → erreur 404', async () => {
    ClientRepository.findById.mockResolvedValue(null);
    await expect(ClientService.getById(999))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('ClientService.create', () => {
  test('création réussie → client retourné', async () => {
    ClientRepository.create.mockResolvedValue(mockClient);
    const result = await ClientService.create(
      { type: 'company', name: 'Entreprise Alpha SARL', payment_terms_days: 30 },
      1, '127.0.0.1'
    );
    expect(result.id).toBe(1);
  });

  test('client occasionnel → payment_terms normalisé', async () => {
    const occasional = { ...mockClient, type: 'occasional', payment_terms_days: 0 };
    ClientRepository.create.mockResolvedValue(occasional);
    const result = await ClientService.create(
      { type: 'occasional', name: 'Client comptoir' }, 1, '127.0.0.1'
    );
    expect(result.type).toBe('occasional');
  });
});

describe('ClientService.update', () => {
  test('mise à jour réussie', async () => {
    ClientRepository.findById.mockResolvedValue(mockClient);
    ClientRepository.update.mockResolvedValue({ ...mockClient, name: 'Alpha Modifié' });
    const result = await ClientService.update(1, { name: 'Alpha Modifié' }, 1, '127.0.0.1');
    expect(result.name).toBe('Alpha Modifié');
  });

  test('client inexistant → erreur 404', async () => {
    ClientRepository.findById.mockResolvedValue(null);
    await expect(ClientService.update(999, { name: 'X' }, 1, '127.0.0.1'))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('ClientService.toggle', () => {
  test('désactivation → active = false', async () => {
    ClientRepository.findById.mockResolvedValue(mockClient);
    ClientRepository.setActive.mockResolvedValue({ ...mockClient, active: false });
    const result = await ClientService.toggle(1, false, 1, '127.0.0.1');
    expect(result.active).toBe(false);
  });
});

describe('ClientService.delete', () => {
  test('suppression → désactive le client', async () => {
    ClientRepository.findById.mockResolvedValue(mockClient);
    ClientRepository.setActive.mockResolvedValue({ ...mockClient, active: false });
    await ClientService.delete(1, 1, '127.0.0.1');
    expect(ClientRepository.setActive).toHaveBeenCalledWith(1, false);
  });
});