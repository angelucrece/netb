jest.mock('../../src/config/database');

const db = require('../../src/config/database');
const {
  assertCommercialSite,
  normalizePaymentTerms,
  requiredOccasionalDeposit,
  assertOccasionalDepositPaid,
  assertOccasionalBalancePaid,
} = require('../../src/utils/businessRules');

beforeEach(() => jest.clearAllMocks());

describe('businessRules', () => {
  test('entrepôt central interdit les opérations commerciales', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, type: 'entrepot', active: true }] });

    await expect(assertCommercialSite(1)).rejects.toMatchObject({ statusCode: 403 });
  });

  test('magasin autorise les opérations commerciales', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 2, type: 'magasin', active: true }] });

    await expect(assertCommercialSite(2)).resolves.toBeUndefined();
  });

  test('paiement différé entreprise limité à 30 ou 60 jours', () => {
    expect(normalizePaymentTerms('company', 30)).toBe(30);
    expect(normalizePaymentTerms('company', 60)).toBe(60);
    expect(() => normalizePaymentTerms('company', 45)).toThrow('30 ou 60');
  });

  test('client occasionnel sans paiement différé', () => {
    expect(normalizePaymentTerms('occasional', 0)).toBe(0);
    expect(() => normalizePaymentTerms('occasional', 30)).toThrow('occasionnel');
  });

  test('acompte occasionnel 50% avant livraison', () => {
    const order = { channel: 'occasional', total_amount: 200 };
    expect(requiredOccasionalDeposit(200)).toBe(100);
    expect(() => assertOccasionalDepositPaid(order, 99)).toThrow('50%');
    expect(assertOccasionalDepositPaid(order, 100)).toBeUndefined();
  });

  test('solde occasionnel obligatoire à la livraison', () => {
    const order = { channel: 'occasional', total_amount: 200 };
    expect(() => assertOccasionalBalancePaid(order, 199)).toThrow('solde');
    expect(assertOccasionalBalancePaid(order, 200)).toBeUndefined();
  });
});
