jest.mock('../../src/config/database');
jest.mock('../../src/modules/suppliers/SupplierRepository');
jest.mock('../../src/utils/auditLog', () => ({ logAction: jest.fn() }));

const SupplierRepository = require('../../src/modules/suppliers/SupplierRepository');
const SupplierService    = require('../../src/modules/suppliers/SupplierService');

const mockSupplier = {
  id: 1, name: 'Fournisseur Central',
  contact_name: 'Service commercial', phone: '+237690000001',
  email: 'fournisseur@test.cm', city: 'Douala', active: true,
};

beforeEach(() => jest.clearAllMocks());

describe('SupplierService.getAll', () => {
  test('retourne liste paginée', async () => {
    SupplierRepository.findAll.mockResolvedValue([mockSupplier]);
    SupplierRepository.count.mockResolvedValue(1);
    const result = await SupplierService.getAll({ page: 1, limit: 20 });
    expect(result.suppliers).toHaveLength(1);
    expect(result.pagination).toBeDefined();
  });

  test('liste vide → tableau vide', async () => {
    SupplierRepository.findAll.mockResolvedValue([]);
    SupplierRepository.count.mockResolvedValue(0);
    const result = await SupplierService.getAll({});
    expect(result.suppliers).toHaveLength(0);
  });
});

describe('SupplierService.getById', () => {
  test('fournisseur existant → retourné', async () => {
    SupplierRepository.findById.mockResolvedValue(mockSupplier);
    const result = await SupplierService.getById(1);
    expect(result.id).toBe(1);
    expect(result.name).toBe('Fournisseur Central');
  });

  test('fournisseur inexistant → erreur 404', async () => {
    SupplierRepository.findById.mockResolvedValue(null);
    await expect(SupplierService.getById(999))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('SupplierService.create', () => {
  test('création réussie → fournisseur retourné', async () => {
    SupplierRepository.create.mockResolvedValue(mockSupplier);
    const result = await SupplierService.create(
      { name: 'Fournisseur Central', city: 'Douala' }, 1, '127.0.0.1'
    );
    expect(result.id).toBe(1);
    expect(SupplierRepository.create).toHaveBeenCalledTimes(1);
  });
});

describe('SupplierService.update', () => {
  test('mise à jour réussie', async () => {
    const updated = { ...mockSupplier, name: 'Fournisseur Modifié' };
    SupplierRepository.findById.mockResolvedValue(mockSupplier);
    SupplierRepository.update.mockResolvedValue(updated);
    const result = await SupplierService.update(1, { name: 'Fournisseur Modifié' }, 1, '127.0.0.1');
    expect(result.name).toBe('Fournisseur Modifié');
  });

  test('fournisseur inexistant → erreur 404', async () => {
    SupplierRepository.findById.mockResolvedValue(null);
    await expect(SupplierService.update(999, { name: 'X' }, 1, '127.0.0.1'))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('SupplierService.toggle', () => {
  test('désactivation → active = false', async () => {
    SupplierRepository.findById.mockResolvedValue(mockSupplier);
    SupplierRepository.setActive.mockResolvedValue({ ...mockSupplier, active: false });
    const result = await SupplierService.toggle(1, false, 1, '127.0.0.1');
    expect(result.active).toBe(false);
  });

  test('réactivation → active = true', async () => {
    const inactive = { ...mockSupplier, active: false };
    SupplierRepository.findById.mockResolvedValue(inactive);
    SupplierRepository.setActive.mockResolvedValue({ ...inactive, active: true });
    const result = await SupplierService.toggle(1, true, 1, '127.0.0.1');
    expect(result.active).toBe(true);
  });
});

describe('SupplierService.delete', () => {
  test('suppression → désactive le fournisseur', async () => {
    SupplierRepository.findById.mockResolvedValue(mockSupplier);
    SupplierRepository.setActive.mockResolvedValue({ ...mockSupplier, active: false });
    await SupplierService.delete(1, 1, '127.0.0.1');
    expect(SupplierRepository.setActive).toHaveBeenCalledWith(1, false);
  });
});