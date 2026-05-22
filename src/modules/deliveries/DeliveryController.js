const asyncHandler = require('../../utils/asyncHandler');
const { success, created, paginated } = require('../../utils/ApiResponse');
const DeliveryService = require('./DeliveryService');

// Cette fonction renvoie la liste des bons de livraison.
const getAll = asyncHandler(async (req, res) => {
  const { deliveries, pagination } = await DeliveryService.getAll(req.query);
  paginated(res, deliveries, pagination);
});

// Cette fonction renvoie un bon de livraison precis.
const getById = asyncHandler(async (req, res) => {
  const delivery = await DeliveryService.getById(parseInt(req.params.id, 10));
  success(res, delivery);
});

// Cette fonction cree un bon de livraison pour une vente.
const create = asyncHandler(async (req, res) => {
  const sale = await DeliveryService.create(parseInt(req.params.saleId || req.params.id, 10), req.body, req.user.id, req.ip);
  created(res, sale, 'Bon de livraison cree');
});

// Cette fonction marque le depart de la livraison.
const start = asyncHandler(async (req, res) => {
  const delivery = await DeliveryService.start(parseInt(req.params.id, 10), req.user.id, req.ip);
  success(res, delivery, 'Livraison demarree');
});

// Cette fonction valide la livraison apres controle.
const validate = asyncHandler(async (req, res) => {
  const delivery = await DeliveryService.validate(parseInt(req.params.id, 10), req.user.id, req.ip);
  success(res, delivery, 'Livraison validee');
});

module.exports = { getAll, getById, create, start, validate };
