const asyncHandler = require('../../utils/asyncHandler');
const { success, created, paginated } = require('../../utils/ApiResponse');
const UserService = require('./UserService');

const getAll = asyncHandler(async (req, res) => {
  const { users, pagination } = await UserService.getUsers(req.query);
  paginated(res, users, pagination);
});

const getMe = asyncHandler(async (req, res) => {
  const user = await UserService.getUserById(req.user.id);
  success(res, user);
});

const getById = asyncHandler(async (req, res) => {
  const user = await UserService.getUserById(parseInt(req.params.id));
  success(res, user);
});

const create = asyncHandler(async (req, res) => {
  const user = await UserService.createUser(req.body, req.user.id, req.ip);
  created(res, user, 'Utilisateur créé');
});

const update = asyncHandler(async (req, res) => {
  const user = await UserService.updateUser(parseInt(req.params.id), req.body, req.user.id, req.ip);
  success(res, user, 'Utilisateur mis à jour');
});

const changePassword = asyncHandler(async (req, res) => {
  await UserService.changePassword(req.user.id, req.body);
  success(res, null, 'Mot de passe modifié');
});

const toggle = asyncHandler(async (req, res) => {
  const user = await UserService.toggleUser(parseInt(req.params.id), req.body.active, req.user.id);
  success(res, user, `Compte ${req.body.active ? 'activé' : 'désactivé'}`);
});

const remove = asyncHandler(async (req, res) => {
  await UserService.deleteUser(parseInt(req.params.id), req.user.id);
  success(res, null, 'Utilisateur supprimé');
});

module.exports = { getAll, getMe, getById, create, update, changePassword, toggle, remove };
