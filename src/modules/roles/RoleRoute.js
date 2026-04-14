// // modules/roles/role.routes.js
// // Description : Routes Express pour les rôles

// const express = require('express');
// const router = express.Router();
// const RoleController = require('./RoleController');

// // // Routes CRUD
// // router.get('/', RoleController.getAll);
// // router.get('/:id', RoleController.getById);
// // router.post('/', RoleController.create);
// // router.put('/:id', RoleController.update);
// // router.delete('/:id', RoleController.delete);

// // module.exports = router;
// //const express = require('express');


// //const RoleController = require('./role.controller');
// const { authenticateToken, requireAdmin } = require('../../middleware/auth');

// /**
//  * Routes des rôles
//  */


// // Liste des rôles

// /**
//  * @swagger
//  * /roles:
//  *   get:
//  *     summary: Récupère la liste des rôles
//  *     description: Retourne une liste de tous les rôles.
//  *     tags:
//  *       - Rôles
//  *     responses:
//  *       200:
//  *         description: Liste des rôles.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: array
//  *               items:
//  *                 type: object
//  *                 properties:
//  *                   id:
//  *                     type: integer
//  *                     example: 1
//  *                   name:
//  *                     type: string
//  *                     example: "Admin"
//  *                   description:
//  *                     type: string
//  *                     example: "Rôle avec tous les droits"
//  *       401:
//  *         description: Non autorisé. Token manquant ou invalide.
//  *       403:
//  *         description: Accès refusé. L'utilisateur doit être admin.
//  *       500:
//  *         description: Erreur serveur.
//  */
// router.get('/', authenticateToken, requireAdmin, RoleController.getAll);

// // Détail d’un rôle


// /**
//  * @swagger
//  * /roles/{id}:
//  *   get:
//  *     summary: Récupère un rôle par ID
//  *     description: Retourne les détails d'un rôle spécifique.
//  *     tags:
//  *       - Rôles
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: integer
//  *         description: ID du rôle à récupérer
//  *     responses:
//  *       200:
//  *         description: Détails du rôle.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 id:
//  *                   type: integer
//  *                   example: 1
//  *                 name:
//  *                   type: string
//  *                   example: "Admin"
//  *                 description:
//  *                   type: string
//  *                   example: "Rôle avec tous les droits"
//  *       401:
//  *         description: Non autorisé. Token manquant ou invalide.
//  *       403:
//  *         description: Accès refusé. L'utilisateur doit être admin.
//  *       404:
//  *         description: Rôle non trouvé.
//  *       500:
//  *         description: Erreur serveur.
//  */
// router.get('/:id', authenticateToken, requireAdmin, RoleController.getById);


// //creation d'un role
// /**
//  * @swagger
//  * /roles:
//  *   post:
//  *     summary: Crée un nouveau rôle
//  *     description: Permet de créer un nouveau rôle avec un nom et une description.
//  *     tags:
//  *       - Rôles
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               name:
//  *                 type: string
//  *                 example: "Manager"
//  *               description:
//  *                 type: string
//  *                 example: "Rôle avec des droits de gestion"
//  *     responses:
//  *       201:
//  *         description: Rôle créé avec succès.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 id:
//  *                   type: integer
//  *                   example: 1
//  *                 name:
//  *                   type: string
//  *                   example: "Manager"
//  *                 description:
//  *                   type: string
//  *                   example: "Rôle avec des droits de gestion"
//  *       400:
//  *         description: Requête invalide. Données manquantes ou incorrectes.
//  *       401:
//  *         description: Non autorisé. Token manquant ou invalide.
//  *       403:
//  *         description: Accès refusé. L'utilisateur doit être admin.
//  *       500:
//  *         description: Erreur serveur.
//  */
// router.post('/', authenticateToken, requireAdmin, RoleController.create);

// /**
//  * @swagger
//  * /roles/{id}:
//  *   put:
//  *     summary: Met à jour un rôle existant
//  *     description: Permet de mettre à jour les informations d'un rôle spécifique.
//  *     tags:
//  *       - Rôles
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: integer
//  *         description: ID du rôle à mettre à jour
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               name:
//  *                 type: string
//  *                 example: "Manager"
//  *               description:
//  *                 type: string
//  *                 example: "Rôle avec des droits de gestion"
//  *     responses:
//  *       200:
//  *         description: Rôle mis à jour avec succès.
//  *         content:
//  *           application/json:
//  *              schema:
//  *                  type: object
//  *                 properties:
//  *                 id:
//  *                   type: integer
//  *                   example: 1
//  *                 name:
//  *                   type: string
//  *                   example: "Manager"
//  *                 description:
//  *                   type: string
//  *                   example: "Rôle avec des droits de gestion"
//  *       400:
//  *         description: Requête invalide. Données manquantes ou incorrectes.
//  *       401:
//  *         description: Non autorisé. Token manquant ou invalide.
//  *       403:
//  *         description: Accès refusé. L'utilisateur doit être admin.
//  *       404:
//  *         description: Rôle non trouvé.
//  *       500:
//  *         description: Erreur serveur.
//  */
// //modifier un role
// router.put('/:id', authenticateToken, requireAdmin, RoleController.update);


// //suppression d'un role
// router.delete('/:id', authenticateToken, requireAdmin, RoleController.delete);

// module.exports = router;


// modules/roles/role.routes.js
const express = require('express');
const router = express.Router();
const RoleController = require('./RoleController');
const { authenticateToken, requireAdmin } = require('../../middleware/auth');

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Récupère la liste des rôles
 *     tags: [Rôles]
 *     responses:
 *       200:
 *         description: Liste des rôles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: "Admin"
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé
 */
router.get('/',  RoleController.getAll);

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     summary: Récupère un rôle par ID
 *     tags: [Rôles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Détails du rôle
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: "Admin"
 *       404:
 *         description: Rôle non trouvé
 */
router.get('/:id', authenticateToken, requireAdmin, RoleController.getById);

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Crée un nouveau rôle
 *     tags: [Rôles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Manager"
 *               description:
 *                 type: string
 *                 example: "Rôle de gestion"
 *     responses:
 *       201:
 *         description: Rôle créé
 *       400:
 *         description: Données invalides
 */
router.post('/', authenticateToken, requireAdmin, RoleController.create);

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     summary: Met à jour un rôle
 *     tags: [Rôles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Rôle mis à jour
 *       404:
 *         description: Rôle non trouvé
 */
router.put('/:id', authenticateToken, requireAdmin, RoleController.update);

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     summary: Supprime un rôle
 *     tags: [Rôles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Rôle supprimé
 *       404:
 *         description: Rôle non trouvé
 */
router.delete('/:id', authenticateToken, requireAdmin, RoleController.delete);

module.exports = router;