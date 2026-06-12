jest.mock('../../src/config/database');
jest.mock('../../src/modules/reports/ReportRepository');
jest.mock('../../src/modules/inventory/InventoryRepository');
jest.mock('exceljs',  () => {
  const ws = {
    columns: [],
    getRow: jest.fn(() => ({ font: {} })),
    addRow: jest.fn(() => ({ getCell: jest.fn(() => ({ fill: {} })) })),
  };
  const wb = {
    addWorksheet: jest.fn(() => ws),
    xlsx: { writeBuffer: jest.fn().mockResolvedValue(Buffer.from('xlsx')) },
    csv:  { writeBuffer: jest.fn().mockResolvedValue(Buffer.from('csv'))  },
  };
  return { Workbook: jest.fn(() => wb) };
});
jest.mock('pdfkit', () => {
  const stream = { on: jest.fn(), end: jest.fn() };
  const doc = {
    info: {},
    fontSize: jest.fn().mockReturnThis(),
    font:     jest.fn().mockReturnThis(),
    text:     jest.fn().mockReturnThis(),
    moveDown: jest.fn().mockReturnThis(),
    end:      jest.fn(),
    pipe:     jest.fn(),
    on:       jest.fn((evt, cb) => { if (evt === 'end') setTimeout(cb, 0); return doc; }),
  };
  return jest.fn(() => doc);
});

const ReportRepository    = require('../../src/modules/reports/ReportRepository');
const InventoryRepository = require('../../src/modules/inventory/InventoryRepository');
const db                  = require('../../src/config/database');
const ReportService       = require('../../src/modules/reports/ReportService');

beforeEach(() => jest.clearAllMocks());

describe('ReportService.getDashboard', () => {
  test('retourne données dashboard', async () => {
    ReportRepository.getDashboard.mockResolvedValue({ total_sales: 5, total_purchases: 3 });
    const result = await ReportService.getDashboard(1);
    expect(result.total_sales).toBe(5);
  });

  test('sans site_id → dashboard global', async () => {
    ReportRepository.getDashboard.mockResolvedValue({ total_sales: 20 });
    const result = await ReportService.getDashboard(null);
    expect(ReportRepository.getDashboard).toHaveBeenCalledWith(null);
    expect(result.total_sales).toBe(20);
  });
});

describe('ReportService.getStockReport', () => {
  test('retourne rapport de stock', async () => {
    const rows = [{ id: 1, name: 'Produit A', quantity: 10, is_alert: false }];
    ReportRepository.getStockReport.mockResolvedValue(rows);
    const result = await ReportService.getStockReport({});
    expect(result).toHaveLength(1);
  });
});

describe('ReportService.getMovementsReport', () => {
  test('retourne rapport mouvements', async () => {
    ReportRepository.getMovementsReport.mockResolvedValue([{ id: 1, type: 'entry' }]);
    const result = await ReportService.getMovementsReport({ site_id: 1 });
    expect(result[0].type).toBe('entry');
  });
});

describe('ReportService.getAlerts', () => {
  test('retourne alertes stock bas avec site_id', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 1, name: 'Produit B', quantity: 2 }] });
    const result = await ReportService.getAlerts(1);
    expect(result).toHaveLength(1);
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  test('retourne alertes toutes les sites sans site_id', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const result = await ReportService.getAlerts(null);
    expect(result).toHaveLength(0);
  });
});

describe('ReportService.getSitesStockComparison', () => {
  test('retourne comparaison inter-sites', async () => {
    ReportRepository.getSitesStockComparison.mockResolvedValue([
      { site: 'Siège', total: 100 },
    ]);
    const result = await ReportService.getSitesStockComparison();
    expect(result).toHaveLength(1);
  });
});

describe('ReportService.getInventoryReport', () => {
  test('session existante → rapport retourné', async () => {
    InventoryRepository.findSessionById.mockResolvedValue({ id: 5 });
    ReportRepository.getInventoryReport.mockResolvedValue([{ product_id: 1 }]);
    const result = await ReportService.getInventoryReport(5);
    expect(result.session.id).toBe(5);
    expect(result.items).toHaveLength(1);
  });

  test('session inexistante → erreur 404', async () => {
    InventoryRepository.findSessionById.mockResolvedValue(null);
    await expect(ReportService.getInventoryReport(999))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('ReportService.exportStockExcel', () => {
  test('génère buffer Excel', async () => {
    ReportRepository.getStockReport.mockResolvedValue([
      { sku: 'REF-001', name: 'Produit A', quantity: 10, is_alert: false },
    ]);
    const buffer = await ReportService.exportStockExcel({});
    expect(Buffer.isBuffer(buffer)).toBe(true);
  });
});