jest.mock('../../src/config/database');
jest.mock('bcryptjs');

const db      = require('../../src/config/database');
const bcrypt  = require('bcryptjs');
const UserService = require('../../src/modules/users/UserService');

const mockUser = {
  id: 2, email: 'operator@nethastock.com',
  first_name: 'Op', last_name: 'Stock',
  active: true, role_id: 2, site_id: 1,
  role_name: 'operator_stock',
};

beforeEach(() => jest.clearAllMocks());

describe('UserService.createUser', () => {
  test('création réussie → user retourné', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })          // findByEmail → pas de doublon
      .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // INSERT RETURNING id
      .mockResolvedValueOnce({ rows: [mockUser] })  // findById
      .mockResolvedValueOnce({ rows: [] });          // auditLog

    bcrypt.hash.mockResolvedValue('$2b$12$hashed'); // NOSONAR: valeur mock pour test unitaire

    const user = await UserService.createUser(
      { email: 'operator@nethastock.com', password: 'noutong1',
        first_name: 'Op', last_name: 'Stock', role_id: 2, site_id: 1 },
      1, '127.0.0.1'
    );
    expect(user.email).toBe('operator@nethastock.com');
    expect(bcrypt.hash).toHaveBeenCalledWith('noutong1', 12);
  });

  test('email dupliqué → erreur 409', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 99 }] }); // findByEmail → existe

    await expect(
      UserService.createUser(
        { email: 'operator@nethastock.com', password: 'noutong1',
          first_name: 'Op', last_name: 'Stock', role_id: 2 },
        1, '127.0.0.1'
      )
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('UserService.getUserById', () => {
  test('user existant → retourné', async () => {
    db.query.mockResolvedValueOnce({ rows: [mockUser] });
    const user = await UserService.getUserById(2);
    expect(user.id).toBe(2);
  });

  test('user inexistant → erreur 404', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(UserService.getUserById(99)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('UserService.changePassword', () => {
  test('ancien mdp incorrect → erreur 400', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ password_hash: '$2b$12$hashed' }] }); // NOSONAR: valeur mock pour test unitaire
    bcrypt.compare.mockResolvedValue(false);

    await expect(
      UserService.changePassword(2, { old_password: 'wrong', new_password: 'newpass' })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test('ancien mdp correct → mot de passe mis à jour', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ password_hash: '$2b$12$hashed' }] }) // NOSONAR: valeur mock pour test unitaire
      .mockResolvedValueOnce({ rows: [] }); // UPDATE

    bcrypt.compare.mockResolvedValue(true);
    bcrypt.hash.mockResolvedValue('$2b$12$newhash'); // NOSONAR: valeur mock pour test unitaire

    await expect(
      UserService.changePassword(2, { old_password: 'noutong1', new_password: 'newpass1' })
    ).resolves.toBeUndefined();
  });
});

describe('UserService.toggleUser', () => {
  test('toggle → active inversé', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [mockUser] })                      // getUserById
      .mockResolvedValueOnce({ rows: [{ id: 2 }] })                     // toggle UPDATE
      .mockResolvedValueOnce({ rows: [{ ...mockUser, active: false }] }); // findById

    const user = await UserService.toggleUser(2, false, 1);
    expect(user.active).toBe(false);
  });

  test('auto-toggle → erreur 400', async () => {
    db.query.mockResolvedValueOnce({ rows: [mockUser] }); // getUserById
    await expect(UserService.toggleUser(1, false, 1)).rejects.toMatchObject({ statusCode: 400 });
  });
});