// Description : Routes d'authentification

const express = require('express');
const router = express.Router();

const controller = require('./AuthController');

const { validateLogin, validateRegister } = require('../../middleware/validation');
const { authLimiter } = require('../../middleware/rateLimiter');
const { authenticateToken, requireRoles } = require('../../middleware/auth');

// Login
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Connecte un utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "admin@nethasoft.com"
 *               password:
 *                 type: string
 *                 example: "Admin123!"
 *     responses:
 *       200:
 *         description: Connexion réussie.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Données de connexion invalides.
 *       401:
 *         description: Non autorisé. Identifiants incorrects.
 */
router.post('/login', authLimiter,validateLogin, controller.login);

// Register (admin seulement)
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Enregistre un nouvel utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *     responses:
 *       201:
 *         description: Utilisateur enregistré avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 email:
 *                   type: string
 *                   example: "user@example.com"
 *                 name:
 *                   type: string
 *                   example: "John Doe"
 *       400:
 *         description: Données d'enregistrement invalides.
 */
router.post(
  '/register',
  authenticateToken,
  requireRoles('administrateur'),
  validateRegister,
  controller.register
);

// Vérifier token
/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Vérifie la validité d'un token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Token valide.
 *       401:
 *         description: Token invalide.
 */
router.get('/verify', authenticateToken, controller.verify);

// Refresh token
/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Régénère un nouveau token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Nouveau token généré.
 *       401:
 *         description: Token invalide.
 */
router.post('/refresh', authenticateToken, controller.refresh);

module.exports = router;