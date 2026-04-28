/**
 * Helpers pour les réponses HTTP uniformes
 * Format : { success, message, data, pagination? }
 */

const success = (res, data = null, message = 'Succès', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

const created = (res, data, message = 'Créé avec succès') => {
  return success(res, data, message, 201);
};

const paginated = (res, data, pagination, message = 'Succès') => {
  return res.status(200).json({ success: true, message, data, pagination });
};

const error = (res, message = 'Erreur serveur', statusCode = 500, details = []) => {
  return res.status(statusCode).json({ success: false, message, errors: details });
};

module.exports = { success, created, paginated, error };
