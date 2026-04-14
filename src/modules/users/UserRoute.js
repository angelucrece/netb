// const express = require('express');
// const router = express.Router();

// // Example user controller imports
// const UserController = require('./UserController');

// // Get all users
// router.get('/', UserController.getAllUsers);

// // Get user by ID
// router.get('/:id', UserController.getUserById);

// // Create new user
// router.post('/', UserController.createUser);

// // Update user by ID
// router.put('/:id', UserController.updateUser);

// // Delete user by ID
// router.delete('/:id', UserController.deleteUser);

// module.exports = router;
// const express = require('express');
// const UserController = require('./UserController');

// class UserRoute {
//     constructor() {
//         this.router = express.Router();

//         // Get all users
//         this.router.get('/', UserController.getAllUsers);

//         // Get user by ID
//         this.router.get('/:id', UserController.getUserById);

//         // // Create new user
//         // this.router.post('/', UserController.createUser);

//         // Update user by ID
//         this.router.put('/:id', UserController.updateUser);
//     }
// }

// module.exports = new UserRoute().router;


const express = require('express');
const router = express.Router();

const UserController = require('./UserController');
const { authenticateToken, requireAdmin } = require('../../middleware/auth');

/**
 * Routes utilisateurs
 */
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Récupérer tous les utilisateurs
 *     responses:
 *       200:
 *         description: Liste des utilisateurs
 */
// Liste utilisateurs
router.get('/', UserController.getAll);

// Détail utilisateur
router.get('/:id',authenticateToken, requireAdmin,UserController.getById);
//router.get('/:id(\\d+)', authenticateToken, requireAdmin, UserController.getById);

//creer un nouvel utilisateur
router.post('/',authenticateToken, requireAdmin,UserController.create)

// Modifier utilisateur
router.put('/:id',authenticateToken, requireAdmin, UserController.update);

// Désactiver utilisateur
router.delete('/:id',authenticateToken, requireAdmin,UserController.delete);

module.exports = router;