jest.mock('../../src/config/database');
jest.mock('../../src/modules/purchases/PurchaseRepository');
jest.mock('../../src/utils/auditLog', () => ({ logAction: jest.fn() }));

const db = require('../../src/config/database');
const PurchaseRepository = require('../../src/modules/purchases/PurchaseRepository');
const PurchaseService = require('../../src/modules/purchases/PurchaseService');

const purchaseOrder = {
  id: 4,
  site_id: 1,
  status: 'ordered',
  reference: 'PO-4',
  supplier_name: 'Fournisseur Central',
  items: [
    {
      id: 11,
      product_id: 2,
      quantity: 10,
      received_quantity: 0,
      unit_price: 50,
    },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('PurchaseService.receive', () => {
  test('reception complete -> stock, document et statut recu', async () => {
    PurchaseRepository.findById
      .mockResolvedValueOnce(purchaseOrder)
      .mockResolvedValueOnce({ ...purchaseOrder, status: 'received' });

    const client = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 30 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ complete: true }] }),
    };
    db.transaction.mockImplementation(async (cb) => cb(client));
    PurchaseRepository.updateStatus.mockResolvedValue(undefined);

    const result = await PurchaseService.receive(4, {}, 7, '127.0.0.1');

    expect(PurchaseRepository.updateStatus).toHaveBeenCalledWith(4, 'received', 7, client);
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO product_stocks'),
      [2, 1, 10]
    );
    expect(result.status).toBe('received');
  });

  test('quantite superieure au reste -> erreur 400', async () => {
    PurchaseRepository.findById.mockResolvedValue(purchaseOrder);
    db.transaction.mockImplementation(async (cb) => cb({ query: jest.fn() }));

    await expect(
      PurchaseService.receive(4, { items: [{ item_id: 11, quantity: 20 }] }, 7, '127.0.0.1')
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
