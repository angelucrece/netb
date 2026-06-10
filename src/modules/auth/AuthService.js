const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const db       = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const logger   = require('../../config/logger');

// ── Helpers tokens ──────────────────────────────────────────
const signAccess = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });

const signRefresh = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

const buildPayload = (u) => ({
  id:      u.id,
  email:   u.email,
  site_id: u.site_id,
  role: { id: u.role_id, name: u.role_name },
});

// ── LOGIN ───────────────────────────────────────────────────
const login = async ({ email, password, site_id }, ip) => {
  logger.info('[Auth] Tentative connexion', { email, ip });

  const { rows } = await db.query(
    `SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name,
            u.active, u.site_id,
            r.id   AS role_id,   r.name  AS role_name,
            s.id   AS s_id,      s.name  AS site_name
     FROM users u
     LEFT JOIN roles r ON u.role_id = r.id
     LEFT JOIN sites s ON u.site_id = s.id
     WHERE u.email = $1`,
    [email.toLowerCase().trim()]
  );

  // Message générique pour ne pas révéler si l'email existe
  const invalid = () => ApiError.unauthorized('Email ou mot de passe incorrect');

  if (!rows.length) { logger.warn('[Auth] Email inconnu', { email, ip }); throw invalid(); }

  const u = rows[0];
  if (!u.active) throw ApiError.unauthorized('Compte désactivé');

  // Vérification optionnelle du site
  if (site_id && u.site_id !== Number.parseInt(site_id)) {
    throw ApiError.unauthorized('Site de connexion incorrect');
  }

  const ok = await bcrypt.compare(password, u.password_hash);
  if (!ok) { logger.warn('[Auth] Mauvais mot de passe', { userId: u.id, ip }); throw invalid(); }

  const payload = buildPayload(u);
  const accessToken  = signAccess(payload);
  const refreshToken = signRefresh({ id: u.id });

  // Stocker le refresh token hashé
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await db.query(
    `UPDATE users SET refresh_token = $1, last_login = NOW() WHERE id = $2`,
    [tokenHash, u.id]
  );

  logger.info('[Auth] Connexion réussie', { userId: u.id, role: u.role_name });

  return {
    accessToken,
    refreshToken,
    user: {
      id:        u.id,
      email:     u.email,
      firstName: u.first_name,
      lastName:  u.last_name,
      role:      { id: u.role_id, name: u.role_name },
      site:      { id: u.site_id, name: u.site_name },
    },
  };
};

// ── REFRESH ─────────────────────────────────────────────────
const refresh = async (refreshToken) => {
  let decoded;
  try {
    decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );
  } catch {
    throw ApiError.unauthorized('Refresh token invalide ou expiré');
  }

  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  const { rows } = await db.query(
    `SELECT u.id, u.email, u.active, u.site_id,
            r.id AS role_id, r.name AS role_name
     FROM users u
     LEFT JOIN roles r ON u.role_id = r.id
     WHERE u.id = $1 AND u.refresh_token = $2`,
    [decoded.id, tokenHash]
  );

  if (!rows.length) throw ApiError.unauthorized('Refresh token révoqué ou invalide');
  if (!rows[0].active) throw ApiError.unauthorized('Compte désactivé');

  const accessToken = signAccess(buildPayload(rows[0]));
  return { accessToken };
};

// ── LOGOUT ──────────────────────────────────────────────────
const logout = async (userId) => {
  await db.query(`UPDATE users SET refresh_token = NULL WHERE id = $1`, [userId]);
  logger.info('[Auth] Déconnexion', { userId });
};

module.exports = { login, refresh, logout };
