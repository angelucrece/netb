const {
  assertSiteAccess,
  assertTransferAccess,
  assertDeliveryValidator,
  scopeFiltersToUser,
  scopePayloadToUser,
} = require('../../src/utils/accessControl');

describe('accessControl', () => {
  const localAdmin = { id: 2, site_id: 10, role: { name: 'site_manager' } };
  const superAdmin = { id: 1, site_id: null, role: { name: 'admin' } };

  test('admin agence limité à son site', () => {
    expect(() => assertSiteAccess(localAdmin, 10)).not.toThrow();
    expect(() => assertSiteAccess(localAdmin, 11)).toThrow('Périmètre');
  });

  test('superadmin conserve le périmètre global', () => {
    expect(() => assertSiteAccess(superAdmin, 99)).not.toThrow();
  });

  test('filtres et payloads forcés au site de l’utilisateur local', () => {
    expect(scopeFiltersToUser({}, localAdmin).site_id).toBe(10);
    expect(scopePayloadToUser({ site_id: 10, name: 'X' }, localAdmin).site_id).toBe(10);
  });

  test('transfert local autorisé seulement si le site utilisateur est impliqué', () => {
    expect(() => assertTransferAccess(localAdmin, 10, 20)).not.toThrow();
    expect(() => assertTransferAccess(localAdmin, 20, 10)).not.toThrow();
    expect(() => assertTransferAccess(localAdmin, 20, 30)).toThrow('Transfert limité');
  });

  test('validation livraison réservée au responsable', () => {
    expect(() => assertDeliveryValidator(localAdmin)).not.toThrow();
    expect(() => assertDeliveryValidator({ role: { name: 'delivery_agent' } })).toThrow('responsable');
  });
});
