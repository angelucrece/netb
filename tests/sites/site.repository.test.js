jest.mock('../../src/config/database');
const db             = require('../../src/config/database');
const SiteRepository = require('../../src/modules/sites/SiteRepository');

beforeEach(() => jest.clearAllMocks());

const row = {
  id: 1, name: 'Siège Principal', type: 'entrepot',
  city: 'Yaoundé', country: 'Cameroun', active: true,
};

describe('SiteRepository.findAll', () => {
  test('activeOnly=true → uniquement actifs', async () => {
    db.query.mockResolvedValue({ rows: [row] });
    const result = await SiteRepository.findAll(true);
    expect(result).toHaveLength(1);
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  test('activeOnly=false → tous les sites', async () => {
    db.query.mockResolvedValue({ rows: [row, { ...row, id: 2, active: false }] });
    const result = await SiteRepository.findAll(false);
    expect(result).toHaveLength(2);
  });
});

describe('SiteRepository.findById', () => {
  test('site existant → retourné', async () => {
    db.query.mockResolvedValue({ rows: [row] });
    const result = await SiteRepository.findById(1);
    expect(result.id).toBe(1);
    expect(result.type).toBe('entrepot');
  });

  test('site inexistant → falsy', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const result = await SiteRepository.findById(999);
    expect(result).toBeFalsy();
  });
});

describe('SiteRepository.create', () => {
  test('création → site retourné', async () => {
    db.query.mockResolvedValue({ rows: [row] });
    const result = await SiteRepository.create({
      name: 'Siège Principal', type: 'entrepot',
      city: 'Yaoundé', country: 'Cameroun',
    });
    expect(result.id).toBe(1);
    expect(result.type).toBe('entrepot');
  });
});

describe('SiteRepository.update', () => {
  test('mise à jour → site modifié', async () => {
    db.query.mockResolvedValue({ rows: [{ ...row, name: 'Nouveau Siège' }] });
    const result = await SiteRepository.update(1, { name: 'Nouveau Siège' });
    expect(result.name).toBe('Nouveau Siège');
  });
});

describe('SiteRepository.toggle', () => {
  test('désactivation → active = false', async () => {
    db.query.mockResolvedValue({ rows: [{ ...row, active: false }] });
    const result = await SiteRepository.toggle(1, false);
    expect(result.active).toBe(false);
  });
});

describe('SiteRepository.hasStock', () => {
  test('site avec stock → true', async () => {
    db.query.mockResolvedValue({ rows: [{ '?column?': 1 }] });
    const result = await SiteRepository.hasStock(1);
    expect(result).toBeTruthy();
  });

  test('site sans stock → false', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const result = await SiteRepository.hasStock(1);
    expect(result).toBeFalsy();
  });
});

describe('SiteRepository.softDelete', () => {
  test('suppression douce → désactive le site', async () => {
    db.query.mockResolvedValue({ rows: [{ ...row, active: false }] });
    await SiteRepository.softDelete(1);
    expect(db.query).toHaveBeenCalledTimes(1);
  });
});