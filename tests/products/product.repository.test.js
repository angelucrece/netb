jest.mock('../../src/config/database');
const db                = require('../../src/config/database');
const ProductRepository = require('../../src/modules/products/ProductRepository');

beforeEach(() => jest.clearAllMocks());

const row = {
  id: 1, sku: 'REF-2026-A1B2C3', barcode: 'PROD001',
  name: 'Ordinateur Dell', brand: 'Dell', unit: 'pcs',
  selling_price: 899.99, purchase_price: 650.00,
  threshold: 5, category_id: 1, active: true,
};

describe('ProductRepository.findAll', () => {
  test('sans filtre → liste', async () => {
    db.query.mockResolvedValue({ rows: [row] });
    const result = await ProductRepository.findAll({ limit: 20, offset: 0 });
    expect(result).toHaveLength(1);
  });

  test('filtre par search', async () => {
    db.query.mockResolvedValue({ rows: [row] });
    const result = await ProductRepository.findAll({ search: 'Dell', limit: 10, offset: 0 });
    expect(result[0].name).toBe('Ordinateur Dell');
  });

  test('filtre par category_id', async () => {
    db.query.mockResolvedValue({ rows: [row] });
    const result = await ProductRepository.findAll({ category_id: 1, limit: 10, offset: 0 });
    expect(result[0].category_id).toBe(1);
  });

  test('filtre alert → produits sous seuil', async () => {
    db.query.mockResolvedValue({ rows: [{ ...row, quantity: 2 }] });
    const result = await ProductRepository.findAll({ alert: true, limit: 10, offset: 0 });
    expect(result[0].quantity).toBe(2);
  });
});

describe('ProductRepository.count', () => {
  test('retourne le total', async () => {
    db.query.mockResolvedValue({ rows: [{ count: '10' }] });
    const result = await ProductRepository.count({});
    expect(Number(result)).toBe(10);
  });
});

describe('ProductRepository.findById', () => {
  test('produit existant', async () => {
    db.query.mockResolvedValue({ rows: [row] });
    const result = await ProductRepository.findById(1);
    expect(result.id).toBe(1);
  });

  test('inexistant → falsy', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const result = await ProductRepository.findById(999);
    expect(result).toBeFalsy();
  });
});

describe('ProductRepository.findByBarcode', () => {
  test('code-barre existant → produit retourné', async () => {
    db.query.mockResolvedValue({ rows: [row] });
    const result = await ProductRepository.findByBarcode('PROD001');
    expect(result.barcode).toBe('PROD001');
  });
});

describe('ProductRepository.findBySku', () => {
  test('SKU existant → produit retourné', async () => {
    db.query.mockResolvedValue({ rows: [row] });
    const result = await ProductRepository.findBySku('REF-2026-A1B2C3');
    expect(result.sku).toBe('REF-2026-A1B2C3');
  });
});

describe('ProductRepository.findAlerts', () => {
  test('retourne produits en alerte', async () => {
    db.query.mockResolvedValue({ rows: [{ ...row, quantity: 2 }] });
    const result = await ProductRepository.findAlerts(1);
    expect(result).toHaveLength(1);
  });
});

describe('ProductRepository.updatePhoto', () => {
  test('met à jour la photo', async () => {
    db.query.mockResolvedValue({ rows: [{ ...row, photo_url: 'uploads/prod.jpg' }] });
    const result = await ProductRepository.updatePhoto(1, 'uploads/prod.jpg');
    expect(result.photo_url).toBe('uploads/prod.jpg');
  });
});

describe('ProductRepository.softDelete', () => {
  test('désactive le produit', async () => {
    db.query.mockResolvedValue({ rows: [{ ...row, active: false }] });
    await ProductRepository.softDelete(1);
    expect(db.query).toHaveBeenCalledTimes(1);
  });
});