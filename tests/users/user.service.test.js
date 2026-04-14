//fichier de tests pour le service de gestion des utilisateurs du système

const UserService = require('../../src/modules/users/UserService');
const db = require('../../src/config/database');
const bcrypt = require('bcryptjs');

// Mock de la base de données
jest.mock('../../src/config/database', () => ({
  query: jest.fn()
}));

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('doit créer un utilisateur', async () => {
    const hashedPassword = await bcrypt.hash('123456', 10);

    // Mock de l'insertion de l'utilisateur
    db.query.mockResolvedValue({
      rows: [{ id: 1, email: 'user@example.com' }]
    });

    const result = await UserService.createUser({ email: 'user@example.com', password: '123456' });

    expect(result).toBeDefined();
    expect(result.email).toBe('user@example.com');
  });
});