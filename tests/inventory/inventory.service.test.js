jest.mock('../../src/config/database');
const db = require('../../src/config/database');
const InventoryService = require('../../src/modules/inventory/InventoryService');

const mockSession = { id: 1, site_id: 1, mode: 'complet', status: 'in_progress', started_by: 1 };
const mockItem    = { id: 1, session_id: 1, product_id: 1, theoretical_qty: 10, counted_qty: 8, gap: -2 };

beforeEach(() => jest.clearAllMocks());

describe('InventoryService.startSession', () => {
  test('pas de session active → session créée', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })           // findActiveSession → aucune
      .mockResolvedValueOnce({ rows: [mockSession] }); // createSession

    const s = await InventoryService.startSession({ site_id: 1, mode: 'complet' }, 1);
    expect(s.mode).toBe('complet');
  });

  test('session déjà active → erreur 409', async () => {
    db.query.mockResolvedValueOnce({ rows: [mockSession] }); // findActiveSession → existe

    await expect(
      InventoryService.startSession({ site_id: 1, mode: 'complet' }, 1)
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('InventoryService.addItem', () => {
  test('session active → article enregistré', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [mockSession] }) // findSessionById
      .mockResolvedValueOnce({ rows: [mockItem] });   // upsertItem

    const item = await InventoryService.addItem(1, { product_id: 1, counted_qty: 8 }, 1);
    expect(item.counted_qty).toBe(8);
  });

  test('session non active → erreur 400', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ ...mockSession, status: 'validated' }] });

    await expect(
      InventoryService.addItem(1, { product_id: 1, counted_qty: 8 }, 1)
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('InventoryService.getGaps', () => {
  test('retourne les écarts calculés', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [mockSession] }) // findSessionById
      .mockResolvedValueOnce({ rows: [mockItem] });   // findItems

    const gaps = await InventoryService.getGaps(1);
    expect(gaps[0].gap).toBe(-2);
  });
});

describe('InventoryService.validateSession', () => {
  test('session non active → erreur 400', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ ...mockSession, status: 'validated' }] });

    await expect(InventoryService.validateSession(1, 1)).rejects.toMatchObject({ statusCode: 400 });
  });

  test('validation → stock ajusté', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [mockSession] }) // findSessionById
      .mockResolvedValueOnce({ rows: [mockItem] });   // findItems

    db.transaction.mockImplementation(async (cb) => {
      const client = { query: jest.fn().mockResolvedValue({ rows: [] }) };
      return cb(client);
    });

    db.query
      .mockResolvedValueOnce({ rows: [] })                                          // auditLog
      .mockResolvedValueOnce({ rows: [{ ...mockSession, status: 'validated' }] })  // findSessionById final
      .mockResolvedValueOnce({ rows: [mockItem] });                                 // findItems final

    const s = await InventoryService.validateSession(1, 1);
    expect(s.status).toBe('validated');
  });
});
