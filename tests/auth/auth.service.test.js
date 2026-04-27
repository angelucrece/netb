/**
 * Tests unitaires – AuthService
 * On mock la DB et bcrypt pour tester la logique pure.
 */

jest.mock('../../src/config/database');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const db      = require('../../src/config/database');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');

// Charger le service APRÈS les mocks
const AuthService = require('../../src/modules/auth/AuthService');

// ── Données de test ─────────────────────────────────────────
const mockUser = {
  id: 1,
  email: 'naelle@nethastock.com',
  password_hash: '$2b$12$hashed',
  first_name: 'Naelle',
  last_name: 'Admin',
  active: true,
  site_id: 1,
  role_id: 1,
  role_name: 'admin',
  s_id: 1,
  site_name: 'Siège Principal',
};

beforeEach(() => {
  jest.clearAllMocks();
  // jwt.sign retourne un faux token par défaut
  jwt.sign.mockReturnValue('fake.jwt.token');
});

// ── LOGIN ───────────────────────────────────────────────────
describe('AuthService.login', () => {

  test('succès → retourne accessToken + refreshToken + user', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [mockUser] })  // SELECT user
      .mockResolvedValueOnce({ rows: [] });           // UPDATE last_login

    bcrypt.compare.mockResolvedValue(true);

    const result = await AuthService.login(
      { email: 'naelle@nethastock.com', password: 'noutong1' },
      '127.0.0.1'
    );

    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(result.user.email).toBe('naelle@nethastock.com');
    expect(result.user.role.name).toBe('admin');
  });

  test('email inexistant → erreur 401', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    await expect(
      AuthService.login({ email: 'inconnu@test.com', password: 'xxx' }, '127.0.0.1')
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  test('compte inactif → erreur 401', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ ...mockUser, active: false }] });

    await expect(
      AuthService.login({ email: 'naelle@nethastock.com', password: 'noutong1' }, '127.0.0.1')
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  test('mauvais mot de passe → erreur 401', async () => {
    db.query.mockResolvedValueOnce({ rows: [mockUser] });
    bcrypt.compare.mockResolvedValue(false);

    await expect(
      AuthService.login({ email: 'naelle@nethastock.com', password: 'wrong' }, '127.0.0.1')
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  test('site_id incorrect → erreur 401', async () => {
    db.query.mockResolvedValueOnce({ rows: [mockUser] }); // site_id = 1
    bcrypt.compare.mockResolvedValue(true);

    await expect(
      AuthService.login(
        { email: 'naelle@nethastock.com', password: 'noutong1', site_id: 99 },
        '127.0.0.1'
      )
    ).rejects.toMatchObject({ statusCode: 401 });
  });
});

// ── REFRESH ─────────────────────────────────────────────────
describe('AuthService.refresh', () => {

  test('refresh token valide → nouveau accessToken', async () => {
    jwt.verify.mockReturnValue({ id: 1 });
    db.query.mockResolvedValueOnce({ rows: [{ ...mockUser }] });

    const result = await AuthService.refresh('valid.refresh.token');
    expect(result).toHaveProperty('accessToken');
  });

  test('refresh token invalide (jwt.verify throw) → erreur 401', async () => {
    jwt.verify.mockImplementation(() => { throw new Error('invalid'); });

    await expect(AuthService.refresh('bad.token')).rejects.toMatchObject({ statusCode: 401 });
  });

  test('refresh token révoqué (pas en DB) → erreur 401', async () => {
    jwt.verify.mockReturnValue({ id: 1 });
    db.query.mockResolvedValueOnce({ rows: [] }); // token hash ne correspond pas

    await expect(AuthService.refresh('revoked.token')).rejects.toMatchObject({ statusCode: 401 });
  });

  test('compte inactif → erreur 401', async () => {
    jwt.verify.mockReturnValue({ id: 1 });
    db.query.mockResolvedValueOnce({ rows: [{ ...mockUser, active: false }] });

    await expect(AuthService.refresh('valid.token')).rejects.toMatchObject({ statusCode: 401 });
  });
});

// ── LOGOUT ──────────────────────────────────────────────────
describe('AuthService.logout', () => {

  test('logout → refresh_token mis à NULL en DB', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    await AuthService.logout(1);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('refresh_token = NULL'),
      [1]
    );
  });
});
