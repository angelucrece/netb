jest.mock('../../src/config/database');
const db = require('../../src/config/database');
const CategoryService = require('../../src/modules/categories/CategoryService');

const mockCat = { id: 1, name: 'Électronique', description: null, site_id: null, active: true, product_count: 0 };

beforeEach(() => jest.clearAllMocks());

describe('CategoryService.getById', () => {
  test('existante → retournée', async () => {
    db.query.mockResolvedValueOnce({ rows: [mockCat] });
    const cat = await CategoryService.getById(1);
    expect(cat.name).toBe('Électronique');
  });

  test('inexistante → erreur 404', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(CategoryService.getById(99)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('CategoryService.create', () => {
  test('nom unique → catégorie créée', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })        // findByName → pas de doublon
      .mockResolvedValueOnce({ rows: [mockCat] }) // create
      .mockResolvedValueOnce({ rows: [] });        // auditLog

    const cat = await CategoryService.create({ name: 'Électronique' }, 1, '127.0.0.1');
    expect(cat.name).toBe('Électronique');
  });

  test('nom dupliqué → erreur 409', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 5 }] }); // findByName → existe
    await expect(
      CategoryService.create({ name: 'Électronique' }, 1, '127.0.0.1')
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('CategoryService.delete', () => {
  test('avec produits → erreur 409', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [mockCat] })   // getById
      .mockResolvedValueOnce({ rows: [{ 1: 1 }] }); // hasProducts → true

    await expect(CategoryService.delete(1, 1, '127.0.0.1')).rejects.toMatchObject({ statusCode: 409 });
  });

  test('sans produits → suppression OK', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [mockCat] }) // getById
      .mockResolvedValueOnce({ rows: [] })         // hasProducts → false
      .mockResolvedValueOnce({ rows: [] })         // softDelete
      .mockResolvedValueOnce({ rows: [] });         // auditLog

    await expect(CategoryService.delete(1, 1, '127.0.0.1')).resolves.toBeUndefined();
  });
});
