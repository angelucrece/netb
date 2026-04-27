jest.mock('../../src/config/database');
const db = require('../../src/config/database');
const SiteService = require('../../src/modules/sites/SiteService');

const mockSite = {
  id: 1, name: 'Siège Principal', type: 'entrepot',
  city: 'Yaoundé', active: true,
  product_count: '0', total_stock: '0',
};

beforeEach(() => jest.clearAllMocks());

describe('SiteService.getSiteById', () => {
  test('site existant → retourne le site', async () => {
    db.query.mockResolvedValueOnce({ rows: [mockSite] });
    const site = await SiteService.getSiteById(1);
    expect(site.name).toBe('Siège Principal');
  });

  test('site inexistant → erreur 404', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(SiteService.getSiteById(99)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('SiteService.deleteSite', () => {
  test('site avec stock → erreur 409', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [mockSite] })  // findById
      .mockResolvedValueOnce({ rows: [{ 1: 1 }] }); // hasStock → true

    await expect(SiteService.deleteSite(1)).rejects.toMatchObject({ statusCode: 409 });
  });

  test('site sans stock → suppression OK', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [mockSite] })  // findById
      .mockResolvedValueOnce({ rows: [] })           // hasStock → false
      .mockResolvedValueOnce({ rows: [] });           // softDelete

    await expect(SiteService.deleteSite(1)).resolves.toBeUndefined();
  });
});

describe('SiteService.toggleSite', () => {
  test('toggle active → retourne site mis à jour', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [mockSite] })                    // findById
      .mockResolvedValueOnce({ rows: [{ ...mockSite, active: false }] }); // toggle

    const site = await SiteService.toggleSite(1, false);
    expect(site.active).toBe(false);
  });
});
