

// modules/sites/SiteRoute.js
// Description : Routes Express pour les rôles

const express = require('express');
const router = express.Router();
const SiteController = require('./SiteController');

// // Routes CRUD
// router.get('/', SiteController.getAll);
// router.get('/:id', SiteController.getById);
// router.post('/', SiteController.create);
// router.put('/:id', SiteController.update);
// router.delete('/:id', SiteController.delete);

// module.exports = router;
//const express = require('express');


//const RoleController = require('./role.controller');
const { authenticateToken, requireAdmin } = require('../../middleware/auth');

/**
 * Routes des sites
 */

// Liste des sites
router.get('/',  SiteController.getAll);

// Détail d’un site
router.get('/:id', authenticateToken, requireAdmin, SiteController.getById);

// Création d’un site
router.post('/', authenticateToken, requireAdmin, SiteController.create);

// Mise à jour d’un site
router.put('/:id', authenticateToken, requireAdmin, SiteController.update);

// Suppression d’un site
router.delete('/:id', authenticateToken, requireAdmin, SiteController.delete);

module.exports = router;