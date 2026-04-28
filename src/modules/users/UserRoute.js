const express    = require('express');
const router     = express.Router();
const controller = require('./UserController');
const { authenticate, authorize } = require('../../middleware/auth');
const { validate } = require('../../middleware/validation');
const { createUserSchema, updateUserSchema, changePasswordSchema, toggleSchema } = require('./UserValidation');

/**
 * @swagger
 * tags:
 *   name: Utilisateurs
 *   description: Gestion des comptes utilisateurs
 */

// GET /api/v1/users  – admin
router.get('/', authenticate, authorize('admin'), controller.getAll);

// GET /api/v1/users/me  – tout utilisateur connecté (AVANT /:id)
router.get('/me', authenticate, controller.getMe);

// PATCH /api/v1/users/me/password
router.patch('/me/password', authenticate, validate(changePasswordSchema), controller.changePassword);

// GET /api/v1/users/:id
router.get('/:id', authenticate, authorize('admin'), controller.getById);

// POST /api/v1/users
router.post('/', authenticate, authorize('admin'), validate(createUserSchema), controller.create);

// PUT /api/v1/users/:id
router.put('/:id', authenticate, authorize('admin'), validate(updateUserSchema), controller.update);

// PATCH /api/v1/users/:id/toggle
router.patch('/:id/toggle', authenticate, authorize('admin'), validate(toggleSchema), controller.toggle);

// DELETE /api/v1/users/:id
router.delete('/:id', authenticate, authorize('admin'), controller.remove);

module.exports = router;
