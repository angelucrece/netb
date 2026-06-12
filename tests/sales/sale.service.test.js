jest.mock('../../src/config/database');
jest.mock('../../src/modules/sales/SaleRepository');
jest.mock('../../src/modules/cash/CashRepository');
jest.mock('../../src/utils/auditLog', () => ({ logAction: jest.fn() }));

const db = require('../../src/config/database');
const SaleRepository = require('../../src/modules/sales/SaleRepository');
const CashRepository = require('../../src/modules/cash/CashRepository');
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
    db.query.mockResolvedValue({ rows: [{ id: 1, type: 'magasin', active: true }] });
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
    db.query.mockResolvedValue({ rows: [{ id: 1, type: 'magasin', active: true }] });
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

describe('SaleService règles métier', () => {
  test('création vente en entrepôt -> erreur 403', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, type: 'entrepot', active: true }] });

    await expect(SaleService.create({
      ...saleOrder,
      site_id: 1,
      channel: 'store',
    }, { id: 7, site_id: 1, role: { name: 'commercial' } }, '127.0.0.1'))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  test('vente entreprise sans client -> erreur 400', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 2, type: 'magasin', active: true }] });

    await expect(SaleService.create({
      ...saleOrder,
      site_id: 2,
      channel: 'company',
    }, { id: 7, site_id: 2, role: { name: 'commercial' } }, '127.0.0.1'))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  test('livraison occasionnelle sans acompte 50% -> erreur 400', async () => {
    const order = {
      ...saleOrder,
      status: 'confirmed',
      channel: 'occasional',
      total_amount: 100,
    };
    SaleRepository.findById.mockResolvedValue(order);
    db.query.mockResolvedValue({ rows: [{ id: 1, type: 'magasin', active: true }] });
    SaleRepository.salePaidTotal.mockResolvedValue(40);

    await expect(SaleService.createDelivery(1, {}, { id: 7, site_id: 1, role: { name: 'commercial' } }, '127.0.0.1'))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  test('validation livraison par livreur -> erreur 403', async () => {
    await expect(SaleService.validateDelivery(
      9,
      { id: 8, site_id: 1, role: { name: 'delivery_agent' } },
      '127.0.0.1'
    )).rejects.toMatchObject({ statusCode: 403 });
  });
});

describe('SaleService.registerPayment', () => {
  test('paiement mobile avec caisse ouverte -> facture payee', async () => {
    const invoice = {
      id: 3,
      sale_order_id: 1,
      site_id: 1,
      total_amount: 100,
      paid_amount: 0,
      status: 'issued',
      sale_status: 'invoiced',
    };

    SaleRepository.findInvoiceById
      .mockResolvedValueOnce(invoice)
      .mockResolvedValueOnce({ ...invoice, paid_amount: 100, status: 'paid' });
    CashRepository.findOpen.mockResolvedValue({ id: 9 });

    db.transaction.mockImplementation(async (cb) => cb({ query: jest.fn() }));
    SaleRepository.addPayment.mockResolvedValue(44);
    SaleRepository.invoicePaidTotal.mockResolvedValue(100);
    SaleRepository.updateInvoicePayment.mockResolvedValue(undefined);
    SaleRepository.updateSalePayment.mockResolvedValue(undefined);

    const result = await SaleService.registerPayment(
      3,
      { amount: 100, mode: 'orange_money', type: 'full' },
      { id: 7 },
      '127.0.0.1'
    );

    expect(CashRepository.findOpen).toHaveBeenCalledWith(7, 1);
    expect(SaleRepository.updateInvoicePayment).toHaveBeenCalledWith(3, 100, 'paid', expect.any(Object));
    expect(SaleRepository.updateSalePayment).toHaveBeenCalledWith(1, 'paid', 'closed', expect.any(Object));
    expect(result.status).toBe('paid');
  });
});
