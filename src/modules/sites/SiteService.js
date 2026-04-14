


const SiteRepository = require('./siteRepository');
const Site = require('./siteModel');

/**
 * Service = logique métier
 * Transforme les données et applique des règles
 */
class SiteService {

  // Retourne tous les sites
  static async getSites() {
    const sites = await SiteRepository.findAll();

    // Transformation en objets Site
    return sites.map(site => new Site(site));
  }

  // Retourne un site spécifique
  static async getSiteById(id) {
    const site = await SiteRepository.findById(id);

    if (!site) {
      throw new Error('SITE_NOT_FOUND');
    }

    return new Site(site);
  }

  // Créer un nouveau site
  static async createSite(data) {
    const newSite = await SiteRepository.create(data);
    return new Site(newSite);
  }

  // Mettre à jour un site existant
  static async updateSite(id, data) {
    const updatedSite = await SiteRepository.update(id, data);
    return new Site(updatedSite);
  }

  // Supprimer un site
  static async deleteSite(id) {
    await SiteRepository.delete(id);
    return true;
  }

}

module.exports = SiteService;