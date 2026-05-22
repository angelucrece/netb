jest.mock('../../src/config/database');
jest.mock('../../src/modules/sales/SaleRepository');
jest.mock('../../src/modules/cash/CashRepository');
jest.mock('../../src/modules/payments/PaymentService');
jest.mock('../../src/utils/auditLog', () => ({ logAction: jest.fn() }));

const db = require('../../src/config/database');
const SaleRepository = require('../../src/modules/sales/SaleRepository');
const CashRepository = require('../../src/modules/cash/CashRepository');
const PaymentService = require('../../src/modules/payments/PaymentService');
const SaleService = require('../../src/modules/sales/SaleService');

const saleOrder = {
  id: 1,
  site_id: 1,
  status: 'draft',
  payment_status: 'unpaid',
  delivery_required: false,
  items: [
    { id: 10, product_id: 2, quantity: 5, unit_price: 100 },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SaleService.confirm', () => {
  test('stock insuffisant -> erreur 400', async () => {
    SaleRepository.findById.mockResolvedValue(saleOrder);
    db.transaction.mockImplementation(async (cb) => {
      const client = {
        query: jest.fn().mockResolvedValueOnce({ rows: [{ quantity: 2 }] }),
      };
      return cb(client);
    });

    await expect(SaleService.confirm(1, 7, '127.0.0.1'))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  test('stock suffisant -> sortie stock et statut confirme', async () => {
    SaleRepository.findById
      .mockResolvedValueOnce(saleOrder)
      .mockResolvedValueOnce({ ...saleOrder, status: 'confirmed' });

    const client = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [{ quantity: 10 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] }),
    };
    db.transaction.mockImplementation(async (cb) => cb(client));
    SaleRepository.setStatus.mockResolvedValue(undefined);

    const result = await SaleService.confirm(1, 7, '127.0.0.1');

    expect(SaleRepository.setStatus).toHaveBeenCalledWith(1, 'confirmed', 7, client);
    expect(result.status).toBe('confirmed');
  });
});

describe('SaleService.registerPayment', () => {
  test('delegue au PaymentService apres refactorisation', async () => {
    PaymentService.registerManual.mockResolvedValue({ id: 3, status: 'paid' });

    const result = await SaleService.registerPayment(
      3,
      { amount: 100, mode: 'orange_money', type: 'full' },
      { id: 7 },
      '127.0.0.1'
    );

    expect(PaymentService.registerManual).toHaveBeenCalledWith(
      3,
      { amount: 100, mode: 'orange_money', type: 'full' },
      { id: 7 },
      '127.0.0.1'
    );
    expect(result.status).toBe('paid');
  });
});
