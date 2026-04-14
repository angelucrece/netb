//fichier de tests pour le service d'authentification

const AuthService = require('../../src/modules/auth/AuthService');
const db = require('../../src/config/database');
const bcrypt = require('bcryptjs');
process.env.JWT_SECRET = 'test_secret';

//  MOCK DB
jest.mock('../../src/config/database', () => ({
  query: jest.fn()
}));

describe('AuthService', () => {

});

it('doit connecter un utilisateur valide', async () => {

  const hashedPassword = await bcrypt.hash('123456', 10);

  db.query.mockResolvedValueOnce({
    rows: [
      {
        id: 1,
        email: 'admin@test.com',
        password: hashedPassword
      }
    ]
  });

  const result = await AuthService.login({
    email: 'admin@test.com',
    password: '123456'
  });

  expect(result).toBeDefined();
});

it('doit refuser si utilisateur inexistant', async () => {

  db.query.mockResolvedValueOnce({
    rows: []
  });

  await expect(
    AuthService.login({
      username: 'fake',
      password: '123'
    })
  ).rejects.toThrow();

});

it('doit refuser si mot de passe incorrect', async () => {

  db.query.mockResolvedValueOnce({
    rows: [
      {
        id: 1,
        username: 'admin',
        password: '123456'
      }
    ]
  });

  await expect(
    AuthService.login({
      username: 'admin',
      password: 'wrong'
    })
  ).rejects.toThrow();

});

// it('doit créer un utilisateur', async () => {

//   db.query
//     .mockResolvedValueOnce({ rows: [] }) // email n'existe pas
//     .mockResolvedValueOnce({
//       rows: [{ id: 1, email: 'new@test.com' }]
//     });

//   const fakeUser = { id: 1 };

//   const result = await AuthService.register({
//     email: 'new@test.com',
//     password: '123456',
//     site_name: 'Site A'
//   }, fakeUser);

//   expect(result).toBeDefined();
// });

it('doit créer un utilisateur', async () => {
  // Mock 1: Vérification email existant (SELECT email)
  db.query.mockResolvedValueOnce({ rows: [] });
  
  // Mock 2: Recherche du site (SELECT * FROM sites WHERE name = $1)
  db.query.mockResolvedValueOnce({ 
    rows: [{ id: 1, name: 'Site A' }] 
  });
  
  // Mock 3: Transaction pour la création
  db.transaction = jest.fn(async (callback) => {
    const mockClient = {
      query: jest.fn().mockResolvedValue({
        rows: [{ id: 1, email: 'new@test.com' }]
      })
    };
    const result = await callback(mockClient);
    return result;
  });

  const fakeUser = { id: 1 };

  const result = await AuthService.register({
    email: 'new@test.com',
    password: '123456',
    site_name: 'Site A'
  }, fakeUser);

  expect(result).toBeDefined();
});