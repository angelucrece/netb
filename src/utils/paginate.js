/**
 * Helper pagination
 * @param {number} page    - Page courante (1-based)
 * @param {number} limit   - Éléments par page
 * @param {number} total   - Total d'éléments
 * @returns {{ page, limit, total, totalPages, hasNext, hasPrev, offset }}
 */
const paginate = (page = 1, limit = 20, total = 0) => {
  const p = Math.max(1, parseInt(page));
  const l = Math.min(100, Math.max(1, parseInt(limit)));
  const totalPages = Math.ceil(total / l);

  return {
    page: p,
    limit: l,
    total,
    totalPages,
    hasNext: p < totalPages,
    hasPrev: p > 1,
    offset: (p - 1) * l,
  };
};

module.exports = paginate;
