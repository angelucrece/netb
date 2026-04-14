
// Description : Controller des catégories
// Gère les requêtes HTTP et appelle les services

const CategoryService = require('./CategoryService');
const db = require('../../config/database');
const logger = require('../../config/logger');

class CategoryController {

  static async getAll(req, res) {
    try {
      const categories = await CategoryService.getAll(req.user?.id);

      res.json({
        success: true,
        data: categories
      });

    } catch (error) {
      logger.error('Controller GET categories error', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Erreur récupération catégories'
      });
    }
  }

  static async getById(req, res) {
    try {
      const category = await CategoryService.getById(req.params.id, req.user?.id);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Catégorie non trouvée'
        });
      }

      res.json({ success: true, data: category });

    } catch (error) {
      logger.error('Controller GET category error', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Erreur récupération catégorie'
      });
    }
  }

  static async create(req, res) {
    try {
      const result = await db.transaction(async (client) => {
        return CategoryService.createCategory(
          client,
          req.body.name,
          req.body.description,
          req.body.site_id,
          req.user.id
        );
      });

      res.status(201).json({
        success: true,
        message: 'Catégorie créée',
        data: result
      });

    } catch (error) {
      logger.error('Controller CREATE category error', {
        error: error.message,
        userId: req.user.id
      });

      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async update(req, res) {
    try {
      const existing = await CategoryService.getById(req.params.id, req.user?.id);

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Catégorie non trouvée'
        });
      }

      const result = await db.transaction(async (client) => {
        return CategoryService.updateCategory(
          client,
          req.params.id,
          req.body.name,
          req.body.description,
          req.body.site_id,
          existing,
          req.user.id
        );
      });

      res.json({
        success: true,
        message: 'Catégorie modifiée',
        data: result
      });

    } catch (error) {
      logger.error('Controller UPDATE category error', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async delete(req, res) {
    try {
      const existing = await CategoryService.getById(req.params.id, req.user?.id);

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Catégorie non trouvée'
        });
      }

      await db.transaction(async (client) => {
        await CategoryService.deleteCategory(
          client,
          req.params.id,
          existing.name,
          req.user.id
        );
      });

      res.json({
        success: true,
        message: 'Catégorie supprimée'
      });

    } catch (error) {
      logger.error('Controller DELETE category error', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }


  // Recherche avancée
  static async search(req, res) {
    try {
      const filters = {
        search: req.query.q || req.query.search,
        site_id: req.query.site_id,
        minProducts: req.query.minProducts,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
        page: req.query.page,
        limit: req.query.limit
      };
      
      const result = await CategoryService.searchCategories(filters, req.user?.id);
      
      res.json({
        success: true,
        data: result.categories,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        }
      });
    } catch (e) {
      logger.error('SEARCH categories error', { error: e.message });
      res.status(500).json({ success: false, message: e.message });
    }
  }

  // Auto-complétion
  static async autocomplete(req, res) {
    try {
      const { q } = req.query;
      const limit = parseInt(req.query.limit || 10);
      
      if (!q || q.length < 2) {
        return res.json({ success: true, data: [] });
      }
      
      const results = await CategoryService.autocomplete(q, limit, req.user?.id);
      
      res.json({
        success: true,
        data: results
      });
    } catch (e) {
      logger.error('AUTOCOMPLETE categories error', { error: e.message });
      res.status(500).json({ success: false, message: e.message });
    }
  }


}

module.exports = CategoryController;