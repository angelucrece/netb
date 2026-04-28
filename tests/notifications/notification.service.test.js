jest.mock('../../src/config/database');
const db = require('../../src/config/database');
const NotificationService = require('../../src/modules/notifications/NotificationService');

const mockNotif = { id: 1, user_id: 1, title: 'Alerte stock', body: 'Produit sous seuil', read: false };

beforeEach(() => jest.clearAllMocks());

describe('NotificationService.notify', () => {
  test('crée une notification', async () => {
    db.query.mockResolvedValueOnce({ rows: [mockNotif] });
    const n = await NotificationService.notify({ user_id: 1, title: 'Alerte stock', type: 'alert_low' });
    expect(n.title).toBe('Alerte stock');
  });
});

describe('NotificationService.markRead', () => {
  test('notification existante → marquée lue', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ ...mockNotif, read: true }] });
    const n = await NotificationService.markRead(1, 1);
    expect(n.read).toBe(true);
  });

  test('notification inexistante → erreur 404', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(NotificationService.markRead(99, 1)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('NotificationService.markAllRead', () => {
  test('marque toutes les notifications comme lues', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(NotificationService.markAllRead(1)).resolves.toBeUndefined();
  });
});
