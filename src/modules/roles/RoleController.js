const asyncHandler = require('../../utils/asyncHandler');
const { success }  = require('../../utils/ApiResponse');
const RoleService  = require('./RoleService');

const getAll = asyncHandler(async (req, res) => {
  const roles = await RoleService.getRoles();
  success(res, roles);
});

const getById = asyncHandler(async (req, res) => {
  const role = await RoleService.getRoleById(Number.parseInt(req.params.id));
  success(res, role);
});

module.exports = { getAll, getById };
