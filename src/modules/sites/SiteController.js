

const SiteService = require('./siteService');

/**
 * Controller = gestion des requêtes HTTP
 */
class SiteController {

  // GET /sites
  static async getAll(req, res) {
    try {
      const sites = await SiteService.getSites();

      res.json({
        success: true,
        data: sites
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // GET /sites/:id
  static async getById(req, res) {
    try {
      const site = await SiteService.getSiteById(req.params.id);

      res.json({
        success: true,
        data: site
      });

    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

    // POST /sites
  static async create(req, res) {
    try {
      const site = await SiteService.createSite(req.body);

      res.status(201).json({
        success: true,
        data: site
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // PUT /sites/:id
  static async update(req, res) {
    try {
      const site = await SiteService.updateSite(req.params.id, req.body);

      res.json({
        success: true,
        data: site
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // DELETE /sites/:id
  static async delete(req, res) {
    try {
      await SiteService.deleteSite(req.params.id);

      res.json({
        success: true,
        message: 'Site supprimé avec succès'
      });

    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

}

module.exports = SiteController;