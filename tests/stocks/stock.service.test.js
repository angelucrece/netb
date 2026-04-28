jest.mock('../../src/config/database');
const db = require('../../src/config/database');
const StockService = require('../../src/modules/stocks/StockService');

const mockStock = { id: 1, product_id: 1, site_id: 1, quantity: 50, min_stock: 5 };

beforeEach(() => jest.clearAllMocks());

describe('StockService.transfer', () => {
  const baseTransfer = { product_id: 1, from_site_id: 1, to_site_id: 2, quantity: 10, userId: 1 };

  test('sites identiques → erreur 400', async () => {
    await expect(
      StockService.transfer({ ...baseTransfer, to_site_id: 1 })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test('stock insuffisant → erreur 400', async () => {
    db.transaction.mockImplementation(async (cb) => {
      const client = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [{ quantity: 5 }] }) // SELECT FOR UPDATE
      };
      return cb(client);
    });

    await expect(
      StockService.transfer({ ...baseTransfer, quantity: 20 })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test('transfert suffisant → succès', async () => {
    db.transaction.mockImplementation(async (cb) => {
      const client = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [{ quantity: 50 }] }) // SELECT FOR UPDATE
          .mockResolvedValueOnce({ rows: [mockStock] })         // adjustQuantity source
          .mockResolvedValueOnce({ rows: [{ 1: 1 }] })         // dest existe
          .mockResolvedValueOnce({ rows: [mockStock] }),        // adjustQuantity dest
      };
      return cb(client);
    });

    const result = await StockService.transfer(baseTransfer);
    expect(result.message).toBe('Transfert effectué');
  });
});
