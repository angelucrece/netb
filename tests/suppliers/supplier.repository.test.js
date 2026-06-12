jest.mock('../../src/config/database');
const db                 = require('../../src/config/database');
const SupplierRepository = require('../../src/modules/suppliers/SupplierRepository');

beforeEach(() => jest.clearAllMocks());

const row = {
  id: 1, name: 'Fournisseur Central',
  contact_name: 'Service achat', phone: '+237690000001',
  email: 'fournisseur@test.cm', city: 'Douala', active: true,
};

describe('SupplierRepository.findAll', () => {
  test('sans filtre → retourne liste', async () => {
    db.query.mockResolvedValue({ rows: [row] });
    const result = await SupplierRepository.findAll({ limit: 20, offset: 0 });
    expect(result).toHaveLength(1);
  });

  test('avec search → liste filtrée', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const result = await SupplierRepository.findAll({ search: 'XYZ', limit: 10, offset: 0 });
    expect(result).toHaveLength(0);
  });

  test('avec active=false → liste inactifs', async () => {
    db.query.mockResolvedValue({ rows: [{ ...row, active: false }] });
    const result = await SupplierRepository.findAll({ active: false, limit: 10, offset: 0 });
    expect(result[0].active).toBe(false);
  });
});

describe('SupplierRepository.count', () => {
  test('retourne le total', async () => {
    db.query.mockResolvedValue({ rows: [{ count: '3' }] });
    const result = await SupplierRepository.count({});
    expect(Number(result)).toBe(3);
  });
});

describe('SupplierRepository.findById', () => {
  test('id existant → retourne fournisseur', async () => {
    db.query.mockResolvedValue({ rows: [row] });
    const result = await SupplierRepository.findById(1);
    expect(result.id).toBe(1);
  });

  test('id inexistant → retourne falsy', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const result = await SupplierRepository.findById(999);
    expect(result).toBeFalsy();
  });
});

describe('SupplierRepository.create', () => {
  test('création → retourne fournisseur créé', async () => {
    db.query.mockResolvedValue({ rows: [row] });
    const result = await SupplierRepository.create({
      name: 'Fournisseur Central', city: 'Douala',
    });
    expect(result.id).toBe(1);
  });
});

describe('SupplierRepository.update', () => {
  test('mise à jour → retourne fournisseur modifié', async () => {
    db.query.mockResolvedValue({ rows: [{ ...row, name: 'Modifié' }] });
    const result = await SupplierRepository.update(1, { name: 'Modifié' });
    expect(result.name).toBe('Modifié');
  });
});

describe('SupplierRepository.setActive', () => {
  test('désactivation → active = false', async () => {
    db.query.mockResolvedValue({ rows: [{ ...row, active: false }] });
    const result = await SupplierRepository.setActive(1, false);
    expect(result.active).toBe(false);
  });
});