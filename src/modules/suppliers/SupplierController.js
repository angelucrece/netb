const asyncHandler = require('../../utils/asyncHandler');
const { success, created, paginated } = require('../../utils/ApiResponse');
const SupplierService = require('./SupplierService');

const getAll = asyncHandler(async (req, res) => {
  const { suppliers, pagination } = await SupplierService.getAll(req.query);
  paginated(res, suppliers, pagination);
});

const getById = asyncHandler(async (req, res) => {
  const supplier = await SupplierService.getById(parseInt(req.params.id, 10));
  success(res, supplier);
});

const create = asyncHandler(async (req, res) => {
  const supplier = await SupplierService.create(req.body, req.user.id, req.ip);
  created(res, supplier, 'Fournisseur cree');
});

const update = asyncHandler(async (req, res) => {
  const supplier = await SupplierService.update(parseInt(req.params.id, 10), req.body, req.user.id, req.ip);
  success(res, supplier, 'Fournisseur mis a jour');
});

const toggle = asyncHandler(async (req, res) => {
  const supplier = await SupplierService.toggle(parseInt(req.params.id, 10), req.body.active, req.user.id, req.ip);
  success(res, supplier, 'Statut fournisseur mis a jour');
});

const remove = asyncHandler(async (req, res) => {
  await SupplierService.delete(parseInt(req.params.id, 10), req.user.id, req.ip);
  success(res, null, 'Fournisseur desactive');
});

module.exports = { getAll, getById, create, update, toggle, remove };
