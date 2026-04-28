const asyncHandler = require('../../utils/asyncHandler');
const { success }  = require('../../utils/ApiResponse');
const service      = require('./AuthService');

const login = asyncHandler(async (req, res) => {
  const data = await service.login(req.body, req.ip);
  success(res, data, 'Connexion réussie');
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const data = await service.refresh(refreshToken);
  success(res, data, 'Token renouvelé');
});

const logout = asyncHandler(async (req, res) => {
  await service.logout(req.user.id);
  success(res, null, 'Déconnexion réussie');
});

const me = asyncHandler(async (req, res) => {
  success(res, req.user, 'Profil token');
});

module.exports = { login, refresh, logout, me };
