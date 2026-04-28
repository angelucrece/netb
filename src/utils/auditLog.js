const db = require('../config/database');
const logger = require('../config/logger');

/**
 * Enregistre une action dans la table audit_logs
 * @param {object} params
 * @param {number}  params.userId      - Auteur de l'action
 * @param {string}  params.action      - Ex: CREATE_PRODUCT, VALIDATE_MOVEMENT
 * @param {string}  params.entityType  - Ex: product, movement, user
 * @param {number}  params.entityId    - ID de l'entité concernée
 * @param {object}  params.oldValue    - État avant (optionnel)
 * @param {object}  params.newValue    - État après (optionnel)
 * @param {string}  params.ip          - IP de la requête (optionnel)
 * @param {object}  params.client      - Client pg pour transaction (optionnel)
 */
const logAction = async ({ userId, action, entityType, entityId, oldValue, newValue, ip, client }) => {
  try {
    const executor = client || db;
    await executor.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_value, new_value, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId || null,
        action,
        entityType || null,
        entityId || null,
        oldValue ? JSON.stringify(oldValue) : null,
        newValue ? JSON.stringify(newValue) : null,
        ip || null,
      ]
    );
  } catch (err) {
    // Ne jamais faire planter l'app à cause d'un log
    logger.error('Erreur audit log', { action, entityType, entityId, error: err.message });
  }
};

module.exports = { logAction };
