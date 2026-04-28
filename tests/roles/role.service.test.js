jest.mock('../../src/config/database');
const db = require('../../src/config/database');
const RoleService = require('../../src/modules/roles/RoleService');

const mockRoles = [
  { id: 1, name: 'admin',          label: 'Administrateur', level: 1 },
  { id: 2, name: 'operator_stock', label: 'Opérateur Stock', level: 2 },
  { id: 3, name: 'controller',     label: 'Contrôleur',     level: 3 },
  { id: 4, name: 'site_manager',   label: 'Responsable Site', level: 4 },
  { id: 5, name: 'viewer',         label: 'Lecteur',        level: 5 },
  { id: 6, name: 'decision_maker', label: 'Décideur',       level: 6 },
  { id: 7, name: 'accountant',     label: 'Comptable',      level: 7 },
];

beforeEach(() => jest.clearAllMocks());

describe('RoleService.getRoles', () => {
  test('retourne les 7 rôles', async () => {
    db.query.mockResolvedValueOnce({ rows: mockRoles });
    const roles = await RoleService.getRoles();
    expect(roles).toHaveLength(7);
    expect(roles[0].name).toBe('admin');
  });
});

describe('RoleService.getRoleById', () => {
  test('rôle existant → retourne le rôle', async () => {
    db.query.mockResolvedValueOnce({ rows: [mockRoles[0]] });
    const role = await RoleService.getRoleById(1);
    expect(role.name).toBe('admin');
  });

  test('rôle inexistant → erreur 404', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(RoleService.getRoleById(99)).rejects.toMatchObject({ statusCode: 404 });
  });
});
