const asyncHandler = require('../../utils/asyncHandler');
const { success, created, paginated } = require('../../utils/ApiResponse');
const PurchaseService = require('./PurchaseService');

const getAll = asyncHandler(async (req, res) => {
  const { purchases, pagination } = await PurchaseService.getAll(req.query);
  paginated(res, purchases, pagination);
});

const getById = asyncHandler(async (req, res) => {
  const order = await PurchaseService.getById(Number.parseInt(req.params.id, 10));
  success(res, order);
});

const create = asyncHandler(async (req, res) => {
  const order = await PurchaseService.create(req.body, req.user.id, req.ip);
  created(res, order, 'Commande achat creee');
});

const markOrdered = asyncHandler(async (req, res) => {
  const order = await PurchaseService.markOrdered(Number.parseInt(req.params.id, 10), req.user.id, req.ip);
  success(res, order, 'Commande achat envoyee');
});

const receive = asyncHandler(async (req, res) => {
  const order = await PurchaseService.receive(Number.parseInt(req.params.id, 10), req.body, req.user.id, req.ip);
  success(res, order, 'Reception enregistree');
});

const cancel = asyncHandler(async (req, res) => {
  const order = await PurchaseService.cancel(Number.parseInt(req.params.id, 10), req.body.reason, req.user.id, req.ip);
  success(res, order, 'Commande achat annulee');
});

module.exports = { getAll, getById, create, markOrdered, receive, cancel };
