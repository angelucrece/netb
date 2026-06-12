/**
 * Module : contrôle d'accès applicatif.
 * Rôle : centraliser les règles RBAC/ABAC partagées par les services.
 * Dépendances principales : ApiError.
 * Auteur : À compléter.
 * Date : 2026-05-28.
 */
const ApiError = require('./ApiError');

const SUPERADMIN_ROLES = new Set(['admin', 'superadmin']);
const DELIVERY_VALIDATOR_ROLES = new Set(['admin', 'superadmin', 'site_manager', 'controller']);

const roleName = (user) => user?.role?.name || null;

/**
 * Indique si l'utilisateur a un périmètre global.
 * @param {object} user - Utilisateur injecté par le middleware d'authentification.
 * @returns {boolean} true si l'utilisateur peut voir tous les sites.
 */
const isSuperAdmin = (user) => SUPERADMIN_ROLES.has(roleName(user));

/**
 * Vérifie qu'un utilisateur authentifié est disponible.
 * @param {object} user - Utilisateur Express.
 * @throws {ApiError} 401 si l'utilisateur est absent.
 * @returns {void}
 */
const requireUser = (user) => {
  if (!user) throw ApiError.unauthorized('Utilisateur authentifié requis');
};

/**
 * Vérifie l'accès à un site en appliquant la règle :
 * un admin agence est limité strictement à son agence.
 * @param {object} user - Utilisateur connecté.
 * @param {number|string|null} siteId - Site ciblé par l'opération.
 * @throws {ApiError} 403 si le site sort du périmètre autorisé.
 * @returns {void}
 */
const assertSiteAccess = (user, siteId) => {
  if (!user) return;
  requireUser(user);
  if (isSuperAdmin(user)) return;
  if (!user.site_id) throw ApiError.forbidden('Utilisateur sans site affecté');
  if (!siteId) throw ApiError.forbidden('Site requis pour contrôler le périmètre');
  if (Number(siteId) !== Number(user.site_id)) {
    throw ApiError.forbidden('Périmètre limité au site de l’utilisateur');
  }
};

/**
 * Ajoute le filtre site_id obligatoire pour les rôles non globaux.
 * @param {object} filters - Filtres de requête.
 * @param {object} user - Utilisateur connecté.
 * @returns {object} Filtres sécurisés.
 */
const scopeFiltersToUser = (filters = {}, user) => {
  if (!user || isSuperAdmin(user)) return { ...filters };
  const requestedSiteId = filters.site_id || user.site_id;
  assertSiteAccess(user, requestedSiteId);
  return { ...filters, site_id: user.site_id };
};

/**
 * Force le site d'une commande/entité créée par un rôle local.
 * @param {object} data - Données métier entrantes.
 * @param {object} user - Utilisateur connecté.
 * @param {string} key - Nom de la clé site dans data.
 * @returns {object} Données avec site sécurisé.
 */
const scopePayloadToUser = (data = {}, user, key = 'site_id') => {
  if (!user || isSuperAdmin(user)) return { ...data };
  const requestedSiteId = data[key] || user.site_id;
  assertSiteAccess(user, requestedSiteId);
  return { ...data, [key]: user.site_id };
};

/**
 * Vérifie un transfert inter-sites.
 * Précondition : un utilisateur local ne peut initier un transfert que si
 * son site est source ou destination. Un superadmin conserve le périmètre global.
 * @param {object} user - Utilisateur connecté.
 * @param {number|string} fromSiteId - Site source.
 * @param {number|string} toSiteId - Site destination.
 * @throws {ApiError} 403 si le transfert n'implique pas le site de l'utilisateur.
 * @returns {void}
 */
const assertTransferAccess = (user, fromSiteId, toSiteId) => {
  if (!user || isSuperAdmin(user)) return;
  requireUser(user);
  if (!user.site_id) throw ApiError.forbidden('Utilisateur sans site affecté');
  const ownSite = Number(user.site_id);
  if (Number(fromSiteId) !== ownSite && Number(toSiteId) !== ownSite) {
    throw ApiError.forbidden('Transfert limité au site de l’utilisateur');
  }
};

/**
 * Vérifie que l'utilisateur est habilité à valider une livraison.
 * Règle métier : la validation de livraison est une action de responsable.
 * @param {object} user - Utilisateur connecté.
 * @throws {ApiError} 403 si le rôle ne peut pas valider.
 * @returns {void}
 */
const assertDeliveryValidator = (user) => {
  requireUser(user);
  if (!DELIVERY_VALIDATOR_ROLES.has(roleName(user))) {
    throw ApiError.forbidden('Validation de livraison réservée au responsable');
  }
};

module.exports = {
  isSuperAdmin,
  assertSiteAccess,
  scopeFiltersToUser,
  scopePayloadToUser,
  assertTransferAccess,
  assertDeliveryValidator,
};
