//fichier de tests pour le service de gestion des stocks

const StockService = require('../../src/modules/stocks/StockService');
const db = require('../../src/config/database');

// Mock de la base de données
jest.mock('../../src/config/database', () => ({
  query: jest.fn()
}));

// Mock des modules avec des fonctions vides
jest.mock('../../src/modules/sites/SiteService', () => ({
  getSiteById: jest.fn()
}));

jest.mock('../../src/modules/products/ProductService', () => ({
  getById: jest.fn()
}));

jest.mock('../../src/modules/sites/SiteRepository', () => ({
  findById: jest.fn()
}));

const SiteService = require('../../src/modules/sites/siteService');
const ProductService = require('../../src/modules/products/ProductService');

describe('StockService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Réinitialiser les mocks
    SiteService.getSiteById = jest.fn();
    ProductService.getById = jest.fn();
  });

  it('doit ajouter un stock', async () => {
    // Mock du site existant
    SiteService.getSiteById.mockResolvedValue({ id: 1, name: 'Site A' });
    
    // Mock du produit existant
    ProductService.getById.mockResolvedValue({ id: 1, name: 'Produit 1' });
    
    // Mock de l'insertion du stock
    db.query.mockResolvedValue({
      rows: [{ id: 1, product_id: 1, site_id: 1, quantity: 100 }]
    });

    const result = await StockService.addStock({
      productId: 1,
      siteId: 1,
      quantity: 100
    });

    expect(result).toBeDefined();
  });

  it('doit mettre à jour un stock', async () => {
    // Mock de la mise à jour
    db.query.mockResolvedValue({
      rows: [{ id: 1, quantity: 150 }]
    });

    const result = await StockService.updateStock(1, { quantity: 150 });
    expect(result).toBeDefined();
  });

  it('doit refuser si site inexistant', async () => {
    // Mock du site non trouvé
    SiteService.getSiteById.mockResolvedValue(null);

    await expect(
      StockService.addStock({
        productId: 1,
        siteId: 999,
        quantity: 100
      })
    ).rejects.toThrow();
  });

  it('doit refuser si produit inexistant', async () => {
    // Mock du site existant
    SiteService.getSiteById.mockResolvedValue({ id: 1, name: 'Site A' });
    
    // Mock du produit non trouvé
    ProductService.getById.mockResolvedValue(null);

    await expect(
      StockService.addStock({
        productId: 999,
        siteId: 1,
        quantity: 100
      })
    ).rejects.toThrow();
  });
});