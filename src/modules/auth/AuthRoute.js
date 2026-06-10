


const express    = require('express');
const router     = express.Router();
const controller = require('./AuthController');
const { validate }   = require('../../middleware/validation');
const { authenticate } = require('../../middleware/auth');
const { authLimiter }  = require('../../middleware/rateLimiter');
const { loginSchema, refreshSchema } = require('./AuthValidation');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentification JWT
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Connexion utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, example: "naelle@nethastock.com" }
 *               password: { type: string, example: "VotreMotDePasse" }
 *               site_id:  { type: integer, example: 1 }
 *     responses:
 *       200: { description: Connexion réussie – retourne accessToken + refreshToken }
 *       401: { description: Identifiants incorrects }
 */
router.post('/login', authLimiter, validate(loginSchema), controller.login);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Renouveler l'access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200: { description: Nouveau accessToken }
 *       401: { description: Refresh token invalide }
 */
router.post('/refresh', validate(refreshSchema), controller.refresh);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Déconnexion (invalide le refresh token)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Déconnexion réussie }
 */
router.post('/logout', authenticate, controller.logout);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Infos de l'utilisateur connecté (depuis le token)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Payload du token }
 */
router.get('/me', authenticate, controller.me);

module.exports = router;