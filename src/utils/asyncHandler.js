/**
 * Wrapper try/catch pour les controllers async Express
 * Évite de répéter try/catch dans chaque controller
 * Usage : router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
