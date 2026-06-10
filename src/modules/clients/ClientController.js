const asyncHandler = require('../../utils/asyncHandler');
const { success, created, paginated } = require('../../utils/ApiResponse');
const ClientService = require('./ClientService');

const getAll = asyncHandler(async (req, res) => {
  const { clients, pagination } = await ClientService.getAll(req.query);
  paginated(res, clients, pagination);
});

const getById = asyncHandler(async (req, res) => {
  const client = await ClientService.getById(Number.parseInt(req.params.id, 10));
  success(res, client);
});

const create = asyncHandler(async (req, res) => {
  const client = await ClientService.create(req.body, req.user.id, req.ip);
  created(res, client, 'Client cree');
});

const update = asyncHandler(async (req, res) => {
  const client = await ClientService.update(Number.parseInt(req.params.id, 10), req.body, req.user.id, req.ip);
  success(res, client, 'Client mis a jour');
});

const toggle = asyncHandler(async (req, res) => {
  const client = await ClientService.toggle(Number.parseInt(req.params.id, 10), req.body.active, req.user.id, req.ip);
  success(res, client, 'Statut client mis a jour');
});

const remove = asyncHandler(async (req, res) => {
  await ClientService.delete(Number.parseInt(req.params.id, 10), req.user.id, req.ip);
  success(res, null, 'Client desactive');
});

module.exports = { getAll, getById, create, update, toggle, remove };
