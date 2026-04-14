const express = require('express');
const router = express.Router();

const CategoryController = require('./CategoryController');



const { authenticateToken, requireRoles } = require('../../middleware/auth');
const { validateCategory, validateId } = require('./CategoryValidation');

//  ROUTES DE RECHERCHE (à mettre AVANT /:id)
/**
 * @swagger
 * /api/categories/search:
 *   get:
 *     summary: Recherche des catégories
 *     tags: [Catégories]
 *     responses:
 *       200:
 *         description: Liste des catégories trouvées.
 */
router.get('/search', authenticateToken, CategoryController.search);

/**
 * @swagger
 * /api/categories/autocomplete:
 *   get:
 *     summary: Suggestions de catégories
 *     tags: [Catégories]
 *     responses:
 *       200:
 *         description: Liste des catégories suggérées.
 */
router.get('/autocomplete', authenticateToken, CategoryController.autocomplete);

//  ROUTES CRUD
// GET all
/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Récupère toutes les catégories
 *     tags: [Catégories]
 *     responses:
 *       200:
 *         description: Liste de toutes les catégories.
 */
router.get('/',  CategoryController.getAll);

// GET by id
router.get('/:id', authenticateToken, validateId, CategoryController.getById);

// CREATE
router.post(
  '/',
  authenticateToken,
  requireRoles('administrateur'),
  validateCategory,
  CategoryController.create
);

// UPDATE
router.put(
  '/:id',
  authenticateToken,
  requireRoles('administrateur'),
  validateId,
  validateCategory,
  CategoryController.update
);

// DELETE
router.delete(
  '/:id',
  authenticateToken,
  requireRoles('administrateur'),
  validateId,
  CategoryController.delete
);

module.exports = router;