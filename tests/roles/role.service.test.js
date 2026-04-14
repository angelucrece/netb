//fichier de tests pour le service de gestion des roles utilisateurs

const RoleService = require('../../src/modules/roles/RoleService');
const db = require('../../src/config/database');

// Mock de la base de données
jest.mock('../../src/config/database', () => ({
  query: jest.fn()
}));

describe('RoleService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('doit créer un rôle', async () => {
    // Mock de l'insertion du rôle
    db.query.mockResolvedValue({
      rows: [{ id: 1, name: 'Admin' }]
    });

    const result = await RoleService.createRole({ name: 'Admin' });

    expect(result).toBeDefined();
    expect(result.name).toBe('Admin');
  });

  it('doit récupérer tous les rôles', async () => {
    // Mock de la récupération des rôles
    db.query.mockResolvedValue({
      rows: [
        { id: 1, name: 'Admin' },
        { id: 2, name: 'User' }
      ]
    });

    const result = await RoleService.getRoles();

    expect(result).toBeDefined();
    expect(result.length).toBe(2);
  });
});