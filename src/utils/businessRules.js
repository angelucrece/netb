/**
 * Module : règles métier transverses.
 * Rôle : exposer les invariants applicatifs qui doivent rester identiques
 * quel que soit le contrôleur ou le service appelant.
 * Dépendances principales : base PostgreSQL, ApiError.
 * Auteur : À compléter.
 * Date : 2026-05-28.
 */
const db = require('../config/database');
const ApiError = require('./ApiError');

const WAREHOUSE_SITE_TYPE = 'entrepot';
const COMPANY_PAYMENT_TERMS = new Set([30, 60]);

const runner = (client) => client || db;

/**
 * Charge un site depuis la base.
 * @param {number|string} siteId - Identifiant du site.
 * @param {object} [client] - Client PostgreSQL transactionnel optionnel.
 * @throws {ApiError} 404 si le site n'existe pas.
 * @returns {Promise<object>} Site trouvé.
 */
const getSiteOrFail = async (siteId, client) => {
  const { rows } = await runner(client).query(
    'SELECT id, name, type, active FROM sites WHERE id = $1',
    [siteId]
  );
  if (!rows.length || rows[0].active === false) {
    throw ApiError.notFound('Site introuvable ou inactif');
  }
  return rows[0];
};

/**
 * Règle : entrepôt central = pas d'opération commerciale.
 * @param {number|string} siteId - Site de vente, livraison, facture ou caisse.
 * @param {object} [client] - Client PostgreSQL transactionnel optionnel.
 * @throws {ApiError} 403 si le site est un entrepôt.
 * @returns {Promise<void>}
 */
const assertCommercialSite = async (siteId, client) => {
  const site = await getSiteOrFail(siteId, client);
  if (site.type === WAREHOUSE_SITE_TYPE) {
    throw ApiError.forbidden('Aucune opération commerciale n’est autorisée à l’entrepôt central');
  }
};

/**
 * Normalise et valide les conditions de paiement client.
 * Règle : client entreprise = différé 30 ou 60 jours ; client occasionnel = aucun différé.
 * @param {string} type - Type de client.
 * @param {number|string|null} days - Délai fourni.
 * @throws {ApiError} 400 si le délai est incohérent.
 * @returns {number} Délai normalisé.
 */
const normalizePaymentTerms = (type, days) => {
  const value = Number(days || 0);
  if (type === 'company') {
    if (!COMPANY_PAYMENT_TERMS.has(value)) {
      throw ApiError.badRequest('Un client entreprise doit avoir un paiement différé de 30 ou 60 jours');
    }
    return value;
  }
  if (value !== 0) {
    throw ApiError.badRequest('Un client occasionnel ne peut pas avoir de paiement différé');
  }
  return 0;
};

/**
 * Calcule l'acompte minimal requis pour un client occasionnel.
 * Règle : client occasionnel = 50% avant livraison.
 * @param {number|string} totalAmount - Montant total TTC de la vente.
 * @returns {number} Montant minimal de l'acompte.
 */
const requiredOccasionalDeposit = (totalAmount) => {
  const total = Number(totalAmount || 0);
  return Math.round(total * 50) / 100;
};

/**
 * Vérifie l'acompte minimal avant planification de livraison.
 * @param {object} order - Vente chargée avec channel et total_amount.
 * @param {number} paidAmount - Montant déjà encaissé.
 * @throws {ApiError} 400 si l'acompte de 50% n'est pas atteint.
 * @returns {void}
 */
const assertOccasionalDepositPaid = (order, paidAmount) => {
  if (order.channel !== 'occasional') return;
  const required = requiredOccasionalDeposit(order.total_amount);
  if (Number(paidAmount || 0) + 0.001 < required) {
    throw ApiError.badRequest(`Acompte de 50% requis avant livraison (${required})`);
  }
};

/**
 * Vérifie le solde client occasionnel à la livraison.
 * Règle : client occasionnel = 50% restant à la livraison.
 * @param {object} order - Vente chargée.
 * @param {number} paidAmount - Montant déjà encaissé.
 * @throws {ApiError} 400 si le total n'est pas soldé.
 * @returns {void}
 */
const assertOccasionalBalancePaid = (order, paidAmount) => {
  if (order.channel !== 'occasional') return;
  if (Number(paidAmount || 0) + 0.001 < Number(order.total_amount || 0)) {
    throw ApiError.badRequest('Le solde du client occasionnel doit être encaissé à la livraison');
  }
};

module.exports = {
  getSiteOrFail,
  assertCommercialSite,
  normalizePaymentTerms,
  requiredOccasionalDeposit,
  assertOccasionalDepositPaid,
  assertOccasionalBalancePaid,
};
