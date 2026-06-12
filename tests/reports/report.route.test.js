jest.mock('../../src/config/database');
jest.mock('../../src/modules/reports/ReportService');
jest.mock('../../src/utils/auditLog', () => ({ logAction: jest.fn() }));
jest.mock('../../src/middleware/auth', () => ({
  authenticate: (req, res, next) => { req.user = { id: 1, role: { name: 'admin' }, site_id: null }; next(); },
  authorize:    (..._roles) => (_req, _res, next) => next(),
}));
jest.mock('exceljs',  () => ({ Workbook: jest.fn(() => ({ addWorksheet: jest.fn(() => ({ columns:[], getRow: jest.fn(()=>({font:{}})), addRow: jest.fn(()=>({getCell:jest.fn(()=>({fill:{}}))})) })), xlsx: { writeBuffer: jest.fn().mockResolvedValue(Buffer.from('xlsx')) } })) }));
jest.mock('pdfkit',   () => jest.fn(() => ({ info:{}, fontSize: jest.fn().mockReturnThis(), text: jest.fn().mockReturnThis(), end: jest.fn(), on: jest.fn((e,cb)=>{ if(e==='end') setTimeout(cb,0); return this; }) })));

const request       = require('supertest');
const { makeApp }   = require('../helpers/testApp');
const ReportService = require('../../src/modules/reports/ReportService');
const router        = require('../../src/modules/reports/ReportRoute');

const app = makeApp('reports', router);

beforeEach(() => jest.clearAllMocks());

describe('GET /api/v1/reports/dashboard', () => {
  test('200 — retourne données dashboard', async () => {
    ReportService.getDashboard.mockResolvedValue({ total_sales: 5, total_stock_value: 100000 });
    const res = await request(app).get('/api/v1/reports/dashboard');
    expect(res.status).toBe(200);
    expect(res.body.data.total_sales).toBe(5);
  });
});

describe('GET /api/v1/reports/stock', () => {
  test('200 — retourne rapport stock', async () => {
    ReportService.getStockReport.mockResolvedValue([{ id: 1, name: 'Produit A', quantity: 10 }]);
    const res = await request(app).get('/api/v1/reports/stock');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('GET /api/v1/reports/movements', () => {
  test('200 — retourne rapport mouvements', async () => {
    ReportService.getMovementsReport.mockResolvedValue([{ id: 1, type: 'entry' }]);
    const res = await request(app).get('/api/v1/reports/movements');
    expect(res.status).toBe(200);
  });
});

describe('GET /api/v1/reports/alerts', () => {
  test('200 — retourne alertes stock bas', async () => {
    ReportService.getAlerts.mockResolvedValue([{ id: 1, name: 'Produit B', quantity: 2 }]);
    const res = await request(app).get('/api/v1/reports/alerts');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});