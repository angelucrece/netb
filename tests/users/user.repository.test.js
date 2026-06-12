jest.mock('../../src/config/database');
const db             = require('../../src/config/database');
const UserRepository = require('../../src/modules/users/UserRepository');

beforeEach(() => jest.clearAllMocks());

const row = {
  id: 1, email: 'admin@nethastock.com',
  first_name: 'Super', last_name: 'Admin',
  role_id: 1, site_id: 1, active: true,
  role_name: 'admin',
};

describe('UserRepository.findAll', () => {
  test('sans filtre → liste', async () => {
    db.query.mockResolvedValue({ rows: [row] });
    const result = await UserRepository.findAll({ limit: 20, offset: 0 });
    expect(result).toHaveLength(1);
  });

  test('filtre par role_id', async () => {
    db.query.mockResolvedValue({ rows: [row] });
    const result = await UserRepository.findAll({ role_id: 1, limit: 10, offset: 0 });
    expect(result[0].role_id).toBe(1);
  });

  test('filtre par site_id', async () => {
    db.query.mockResolvedValue({ rows: [row] });
    const result = await UserRepository.findAll({ site_id: 1, limit: 10, offset: 0 });
    expect(result[0].site_id).toBe(1);
  });

  test('filtre par search', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const result = await UserRepository.findAll({ search: 'xyz', limit: 10, offset: 0 });
    expect(result).toHaveLength(0);
  });
});

describe('UserRepository.count', () => {
  test('retourne le total', async () => {
    db.query.mockResolvedValue({ rows: [{ count: '8' }] });
    const result = await UserRepository.count({});
    expect(Number(result)).toBe(8);
  });
});

describe('UserRepository.findById', () => {
  test('utilisateur existant', async () => {
    db.query.mockResolvedValue({ rows: [row] });
    const result = await UserRepository.findById(1);
    expect(result.id).toBe(1);
  });

  test('utilisateur inexistant → falsy', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const result = await UserRepository.findById(999);
    expect(result).toBeFalsy();
  });
});

describe('UserRepository.findByEmail', () => {
  test('email existant → utilisateur retourné', async () => {
    db.query.mockResolvedValue({ rows: [row] });
    const result = await UserRepository.findByEmail('admin@nethastock.com');
    expect(result.email).toBe('admin@nethastock.com');
  });

  test('email inexistant → falsy', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const result = await UserRepository.findByEmail('inconnu@test.cm');
    expect(result).toBeFalsy();
  });
});

describe('UserRepository.create', () => {
  test('création → retourne id', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 1 }] });
    const result = await UserRepository.create({
      email: 'admin@nethastock.com',
      password_hash: '$2b$12$hashed', // NOSONAR: mock de test
      first_name: 'Super', last_name: 'Admin',
      role_id: 1, site_id: 1,
    });
    expect(result.id).toBe(1);
  });
});

describe('UserRepository.update', () => {
  test('mise à jour → utilisateur modifié', async () => {
    db.query.mockResolvedValue({ rows: [{ ...row, first_name: 'Modifié' }] });
    const result = await UserRepository.update(1, {
      first_name: 'Modifié', last_name: 'Admin', role_id: 1, site_id: 1, active: true,
    });
    expect(result.first_name).toBe('Modifié');
  });
});

describe('UserRepository.updatePassword', () => {
  test('met à jour le hash', async () => {
    db.query.mockResolvedValue({ rows: [] });
    await UserRepository.updatePassword(1, '$2b$12$newhash'); // NOSONAR: mock de test
    expect(db.query).toHaveBeenCalledTimes(1);
  });
});

describe('UserRepository.toggle', () => {
  test('désactivation → active = false', async () => {
    db.query.mockResolvedValue({ rows: [{ ...row, active: false }] });
    const result = await UserRepository.toggle(1, false);
    expect(result.active).toBe(false);
  });
});

describe('UserRepository.softDelete', () => {
  test('suppression douce → utilisateur désactivé', async () => {
    db.query.mockResolvedValue({ rows: [{ ...row, active: false }] });
    await UserRepository.softDelete(1);
    expect(db.query).toHaveBeenCalledTimes(1);
  });
});