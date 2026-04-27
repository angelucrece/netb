/**
 * Classe d'erreur HTTP personnalisée
 * Usage : throw new ApiError(404, 'Ressource introuvable')
 */
class ApiError extends Error {
  constructor(statusCode, message, details = []) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true; // distingue les erreurs métier des bugs
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details)  { return new ApiError(400, message, details); }
  static unauthorized(message = 'Non authentifié') { return new ApiError(401, message); }
  static forbidden(message = 'Accès refusé')       { return new ApiError(403, message); }
  static notFound(message = 'Ressource introuvable') { return new ApiError(404, message); }
  static conflict(message, details)    { return new ApiError(409, message, details); }
  static unprocessable(message, details) { return new ApiError(422, message, details); }
  static internal(message = 'Erreur serveur') { return new ApiError(500, message); }
}

module.exports = ApiError;
