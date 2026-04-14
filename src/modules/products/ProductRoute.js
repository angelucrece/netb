
// const router = require('express').Router();

// const ProductController = require('./ProductController');
// const { authenticateToken, requireRoles } = require('../../middleware/auth');
// const { validateProduct, validateId } = require('./ProductValidation');
// const { upload } = require('../../config/upload');


// router.get('/name/:name', authenticateToken, ProductController.getByName);
// // ProductRoute.js - Ajoutez ces routes

// // Route de recherche avancée
// router.get('/search', authenticateToken, ProductController.search);

// // Route d'auto-complétion
// router.get('/autocomplete', authenticateToken, ProductController.autocomplete);

// // Route par code-barres
// router.get('/barcode/:barcode', authenticateToken, ProductController.getByBarcode);
// router.get('/', ProductController.getAll);
// router.get('/:id', authenticateToken, validateId, ProductController.getById);

// router.post(
//   '/',
//   authenticateToken,
//   requireRoles('administrateur'),
//   upload.single('photo'),
//   validateProduct,
//   ProductController.create
// );

// router.put(
//   '/:id',
//   authenticateToken,
//   requireRoles('administrateur'),
//   upload.single('photo'),
//   validateId,
//   validateProduct,
//   ProductController.update
// );

// router.delete(
//   '/:id',
//   authenticateToken,
//   requireRoles('administrateur'),
//   validateId,
//   ProductController.delete
// );

// // 🔥 NOUVELLES ROUTES DE RECHERCHE
// //router.get('/search', authenticateToken, ProductController.search);  // Recherche avancée
// //router.get('/barcode/:barcode', authenticateToken, ProductController.getByBarcode);  // Par code-barres


// module.exports = router;


const router = require('express').Router();

const ProductController = require('./ProductController');
const { authenticateToken, requireRoles } = require('../../middleware/auth');
const { validateProduct, validateId, validateSearch } = require('./ProductValidation');
const { upload } = require('../../config/upload');

// ATTENTION : L'ORDRE DES ROUTES EST IMPORTANT !
// Les routes spécifiques DOIVENT être avant les routes avec paramètres

// ========== ROUTES SPÉCIFIQUES (sans paramètre ID) ==========
// Route de recherche avancée
router.get('/search', authenticateToken,validateSearch, ProductController.search);

// Route d'auto-complétion
router.get('/autocomplete', authenticateToken, ProductController.autocomplete);

// Route par code-barres
router.get('/barcode/:barcode', authenticateToken, ProductController.getByBarcode);

// Route par nom
router.get('/name/:name', authenticateToken, ProductController.getByName);

// ========== ROUTES CRUD ==========
// GET all (sans authentification ?)
/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Récupère tous les produits
 *     tags: [Produits]
 *     responses:
 *       200:
 *         description: Liste de tous les produits.
 */
router.get('/', ProductController.getAll);

// POST create avec upload
/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Crée un nouveau produit
 *     tags: [Produits]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Produit créé avec succès.
 */
router.post(
  '/',
  authenticateToken,
  requireRoles('administrateur'),
  upload.single('photo'),
  validateProduct,
  ProductController.create
);

// ========== ROUTES AVEC PARAMÈTRE ID (doivent être après) ==========
// GET by id
router.get('/:id', authenticateToken, validateId, ProductController.getById);

// PUT update avec upload
router.put(
  '/:id',
  authenticateToken,
  requireRoles('administrateur'),
  upload.single('photo'),
  validateId,
  validateProduct,
  ProductController.update
);

// DELETE
router.delete(
  '/:id',
  authenticateToken,
  requireRoles('administrateur'),
  validateId,
  ProductController.delete
);

module.exports = router;