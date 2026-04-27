jest.mock('../../src/config/database');
jest.mock('qrcode');

const db     = require('../../src/config/database');
const QRCode = require('qrcode');
const ProductService = require('../../src/modules/products/ProductService');

const mockProduct = {
  id: 1, sku: 'REF-2026-ABC123', name: 'Câble HDMI',
  barcode: '1234567890123', active: true, total_stock: 10,
  variants: [], stocks: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  QRCode.toFile.mockResolvedValue(undefined);
  QRCode.toDataURL.mockResolvedValue('data:image/png;base64,fake');
});

describe('ProductService.getById', () => {
  test('produit existant → retourné', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [mockProduct] }) // findById main
      .mockResolvedValueOnce({ rows: [] })             // variants
      .mockResolvedValueOnce({ rows: [] });             // stocks
    const p = await ProductService.getById(1);
    expect(p.sku).toBe('REF-2026-ABC123');
  });

  test('produit inexistant → erreur 404', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(ProductService.getById(99)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('ProductService.getByBarcode', () => {
  test('barcode existant → produit retourné', async () => {
    db.query.mockResolvedValueOnce({ rows: [mockProduct] });
    const p = await ProductService.getByBarcode('1234567890123');
    expect(p.name).toBe('Câble HDMI');
  });

  test('barcode inexistant → erreur 404', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(ProductService.getByBarcode('0000000000000')).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('ProductService.create', () => {
  test('création réussie → produit avec QR', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })              // findBySku → unique
      .mockResolvedValueOnce({ rows: [] })              // findByBarcode → unique
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })    // INSERT RETURNING id
      .mockResolvedValueOnce({ rows: [mockProduct] })   // findById main
      .mockResolvedValueOnce({ rows: [] })              // variants
      .mockResolvedValueOnce({ rows: [] })              // stocks
      .mockResolvedValueOnce({ rows: [] });              // auditLog

    const p = await ProductService.create(
      { name: 'Câble HDMI', barcode: '1234567890123' }, null, 1, '127.0.0.1'
    );
    expect(p.sku).toBe('REF-2026-ABC123');
    expect(QRCode.toFile).toHaveBeenCalled();
  });

  test('barcode dupliqué → erreur 409', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })              // findBySku
      .mockResolvedValueOnce({ rows: [mockProduct] });  // findByBarcode → existe

    await expect(
      ProductService.create({ name: 'Test', barcode: '1234567890123' }, null, 1, '127.0.0.1')
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('ProductService.getAlerts', () => {
  test('retourne les produits sous seuil', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Câble HDMI', quantity: 2, min_stock: 5 }] });
    const alerts = await ProductService.getAlerts(1);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].quantity).toBeLessThan(alerts[0].min_stock);
  });
});
