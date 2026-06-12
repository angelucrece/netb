jest.mock('../../src/config/database');
const db               = require('../../src/config/database');
const ClientRepository = require('../../src/modules/clients/ClientRepository');

beforeEach(() => jest.clearAllMocks());

const row = {
  id: 1, type: 'company', name: 'Alpha SARL',
  email: 'alpha@test.cm', phone: '+237690000001',
  payment_terms_days: 30, active: true,
};

describe('ClientRepository.findAll', () => {
  test('sans filtre → retourne liste', async () => {
    db.query.mockResolvedValue({ rows: [row] });
    const result = await ClientRepository.findAll({ limit: 20, offset: 0 });
    expect(result).toHaveLength(1);
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  test('avec search → requête filtrée', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const result = await ClientRepository.findAll({ search: 'Alpha', limit: 10, offset: 0 });
    expect(result).toHaveLength(0);
  });

  test('avec type → filtre par type', async () => {
    db.query.mockResolvedValue({ rows: [row] });
    const result = await ClientRepository.findAll({ type: 'company', limit: 10, offset: 0 });
    expect(result[0].type).toBe('company');
  });

  test('avec active=true → filtre actifs', async () => {
    db.query.mockResolvedValue({ rows: [row] });
    const result = await ClientRepository.findAll({ active: true, limit: 10, offset: 0 });
    expect(result[0].active).toBe(true);
  });
});

describe('ClientRepository.count', () => {
  test('retourne le total', async () => {
    db.query.mockResolvedValue({ rows: [{ count: '5' }] });
    const result = await ClientRepository.count({});
    expect(Number(result)).toBe(5);
  });
});

describe('ClientRepository.findById', () => {
  test('id existant → retourne client', async () => {
    db.query.mockResolvedValue({ rows: [row] });
    const result = await ClientRepository.findById(1);
    expect(result.id).toBe(1);
  });

  test('id inexistant → retourne null/undefined', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const result = await ClientRepository.findById(999);
    expect(result).toBeFalsy();
  });
});

describe('ClientRepository.create', () => {
  test('création → retourne le client créé', async () => {
    db.query.mockResolvedValue({ rows: [row] });
    const result = await ClientRepository.create({
      type: 'company', name: 'Alpha SARL',
      email: 'alpha@test.cm', phone: '+237690000001',
      payment_terms_days: 30,
    });
    expect(result.id).toBe(1);
  });
});

describe('ClientRepository.update', () => {
  test('mise à jour → retourne client modifié', async () => {
    const updated = { ...row, name: 'Alpha Modifié' };
    db.query.mockResolvedValue({ rows: [updated] });
    const result = await ClientRepository.update(1, { name: 'Alpha Modifié' });
    expect(result.name).toBe('Alpha Modifié');
  });
});

describe('ClientRepository.setActive', () => {
  test('désactivation → retourne client inactif', async () => {
    db.query.mockResolvedValue({ rows: [{ ...row, active: false }] });
    const result = await ClientRepository.setActive(1, false);
    expect(result.active).toBe(false);
  });

  test('activation → retourne client actif', async () => {
    db.query.mockResolvedValue({ rows: [{ ...row, active: true }] });
    const result = await ClientRepository.setActive(1, true);
    expect(result.active).toBe(true);
  });
});