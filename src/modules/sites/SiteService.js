const SiteRepository = require('./SiteRepository');
const ApiError = require('../../utils/ApiError');

class SiteService {
  static async getSites(activeOnly = true) {
    return await SiteRepository.findAll(activeOnly);
  }

  static async getSiteById(id) {
    const site = await SiteRepository.findById(id);
    if (!site) throw ApiError.notFound('Site introuvable');
    return site;
  }

  static async createSite(data) {
    return await SiteRepository.create(data);
  }

  static async updateSite(id, data) {
    await this.getSiteById(id); // vérifie existence
    const updated = await SiteRepository.update(id, data);
    if (!updated) throw ApiError.notFound('Site introuvable');
    return updated;
  }

  static async toggleSite(id, active) {
    await this.getSiteById(id);
    return await SiteRepository.toggle(id, active);
  }

  static async deleteSite(id) {
    await this.getSiteById(id);
    const hasStock = await SiteRepository.hasStock(id);
    if (hasStock) throw ApiError.conflict('Impossible de supprimer un site avec du stock');
    await SiteRepository.softDelete(id);
  }
}

module.exports = SiteService;
