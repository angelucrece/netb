//fichier de tests pour le service de gestion des sites

const SiteService = require('../../src/modules/sites/siteService');
const db = require('../../src/config/database');

// Mock de la base de données
jest.mock('../../src/config/database', () => ({
  query: jest.fn()
}));

describe('SiteService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('doit créer un site', async () => {
    // Mock de l'insertion du site
    db.query.mockResolvedValue({
      rows: [{ id: 1, name: 'Site A' }]
    });

    const result = await SiteService.createSite({ name: 'Site A' });

    expect(result).toBeDefined();
    expect(result.name).toBe('Site A');
  });

  it('doit récupérer tous les sites', async () => {
    // Mock de la récupération des sites
    db.query.mockResolvedValue({
      rows: [
        { id: 1, name: 'Site A' },
        { id: 2, name: 'Site B' }
      ]
    });

    const result = await SiteService.getSites();

    expect(result).toBeDefined();
    expect(result.length).toBe(2);
  });
});