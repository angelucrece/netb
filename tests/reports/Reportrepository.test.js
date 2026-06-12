jest.mock('../../src/config/database');
const db               = require('../../src/config/database');
const ReportRepository = require('../../src/modules/reports/ReportRepository');

beforeEach(() => jest.clearAllMocks());

describe('ReportRepository.getDashboard', () => {
  test('avec site_id → dashboard du site', async () => {
    db.query.mockResolvedValue({ rows: [{ total_sales: 5, total_stock_value: 100000 }] });
    const result = await ReportRepository.getDashboard(1);
    expect(result.total_sales).toBe(5);
  });

  test('sans site_id → dashboard global', async () => {
    db.query.mockResolvedValue({ rows: [{ total_sales: 20, total_stock_value: 500000 }] });
    const result = await ReportRepository.getDashboard(null);
    expect(result.total_sales).toBe(20);
  });
});

describe('ReportRepository.getStockReport', () => {
  test('rapport stock complet', async () => {
    db.query.mockResolvedValue({
      rows: [
        { id: 1, name: 'Produit A', quantity: 10, threshold: 5, is_alert: false },
        { id: 2, name: 'Produit B', quantity: 2,  threshold: 5, is_alert: true  },
      ],
    });
    const result = await ReportRepository.getStockReport({});
    expect(result).toHaveLength(2);
    expect(result[1].is_alert).toBe(true);
  });

  test('filtre par site_id', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 1, name: 'Produit A', quantity: 10 }] });
    const result = await ReportRepository.getStockReport({ site_id: 1 });
    expect(result).toHaveLength(1);
  });

  test('filtre par category_id', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const result = await ReportRepository.getStockReport({ category_id: 99 });
    expect(result).toHaveLength(0);
  });
});

describe('ReportRepository.getMovementsReport', () => {
  test('rapport mouvements complet', async () => {
    db.query.mockResolvedValue({
      rows: [
        { id: 1, type: 'entry',  quantity: 10, product_name: 'Produit A' },
        { id: 2, type: 'exit',   quantity: 5,  product_name: 'Produit B' },
      ],
    });
    const result = await ReportRepository.getMovementsReport({});
    expect(result).toHaveLength(2);
  });

  test('filtre par type entry', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 1, type: 'entry', quantity: 10 }] });
    const result = await ReportRepository.getMovementsReport({ type: 'entry' });
    expect(result[0].type).toBe('entry');
  });

  test('filtre par date_from et date_to', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const result = await ReportRepository.getMovementsReport({
      date_from: '2026-01-01', date_to: '2026-01-31',
    });
    expect(result).toHaveLength(0);
  });
});

describe('ReportRepository.getSitesStockComparison', () => {
  test('retourne comparaison inter-sites', async () => {
    db.query.mockResolvedValue({
      rows: [
        { site_name: 'Siège',    total_products: 10, total_value: 500000 },
        { site_name: 'Magasin2', total_products: 5,  total_value: 250000 },
      ],
    });
    const result = await ReportRepository.getSitesStockComparison();
    expect(result).toHaveLength(2);
    expect(result[0].site_name).toBe('Siège');
  });
});

describe('ReportRepository.getInventoryReport', () => {
  test('rapport inventaire pour une session', async () => {
    db.query.mockResolvedValue({
      rows: [
        { product_id: 1, product_name: 'Produit A', theoretical: 10, counted: 9, diff: -1 },
      ],
    });
    const result = await ReportRepository.getInventoryReport(1);
    expect(result).toHaveLength(1);
    expect(result[0].diff).toBe(-1);
  });

  test('session sans items → tableau vide', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const result = await ReportRepository.getInventoryReport(999);
    expect(result).toHaveLength(0);
  });
});