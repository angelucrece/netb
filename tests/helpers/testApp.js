/**
 * testApp.js — Helper partagé pour les tests d'intégration (Supertest)
 * Crée une mini-app Express sans la DB, avec JWT mocké.
 */
'use strict';

const express = require('express');
const jwt     = require('jsonwebtoken');

// JWT secret de test
const TEST_SECRET = 'test-secret-for-jest-only';
process.env.JWT_SECRET = TEST_SECRET;

/**
 * Génère un token JWT valide pour les tests.
 * @param {object} payload — ex: { id:1, role:'admin', site_id:1 }
 */
const makeToken = (payload = {}) =>
  jwt.sign(
    { id: 1, role: 'admin', site_id: 1, ...payload },
    TEST_SECRET,
    { expiresIn: '1h' }
  );

/**
 * Crée une app Express minimale qui monte un router donné sous /api/v1/<prefix>.
 * Le middleware d'auth est remplacé par un stub qui injecte req.user.
 */
const makeApp = (prefix, router, userOverride = {}) => {
  const app = express();
  app.use(express.json());

  // Stub authenticate : injecte req.user sans aller en DB
  app.use((req, res, next) => {
    req.user = {
      id: 1,
      role: { name: 'admin' },
      site_id: 1,
      ...userOverride,
    };
    next();
  });

  app.use(`/api/v1/${prefix}`, router);

  // Handler d'erreur global
  app.use((err, req, res, _next) => {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Erreur serveur',
    });
  });

  return app;
};

module.exports = { makeApp, makeToken, TEST_SECRET };