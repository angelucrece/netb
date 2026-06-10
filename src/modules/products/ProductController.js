const asyncHandler = require('../../utils/asyncHandler');
const { success, created, paginated } = require('../../utils/ApiResponse');
const ProductService = require('./ProductService');

const getAll = asyncHandler(async (req, res) => {
  const { products, pagination } = await ProductService.getAll(req.query);
  paginated(res, products, pagination);
});

const getById = asyncHandler(async (req, res) => {
  const p = await ProductService.getById(Number.parseInt(req.params.id));
  success(res, p);
});

const scan = asyncHandler(async (req, res) => {
  const p = await ProductService.getByBarcode(req.params.barcode);
  success(res, p);
});

const getQrCode = asyncHandler(async (req, res) => {
  const data = await ProductService.getQrCode(Number.parseInt(req.params.id));
  success(res, data);
});

const getAlerts = asyncHandler(async (req, res) => {
  const alerts = await ProductService.getAlerts(req.query.site_id);
  success(res, alerts);
});

const create = asyncHandler(async (req, res) => {
  const photoPath = req.file?.path || null;
  const p = await ProductService.create(req.body, photoPath, req.user.id, req.ip);
  created(res, p, 'Produit créé');
});

const update = asyncHandler(async (req, res) => {
  const p = await ProductService.update(Number.parseInt(req.params.id), req.body, req.user.id, req.ip);
  success(res, p, 'Produit mis à jour');
});

const updatePhoto = asyncHandler(async (req, res) => {
  if (!req.file) throw require('../../utils/ApiError').badRequest('Photo requise');
  const p = await ProductService.updatePhoto(Number.parseInt(req.params.id), req.file.path, req.user.id);
  success(res, p, 'Photo mise à jour');
});

const updateVariants = asyncHandler(async (req, res) => {
  const p = await ProductService.updateVariants(Number.parseInt(req.params.id), req.body.variants, req.user.id);
  success(res, p, 'Variantes mises à jour');
});

const remove = asyncHandler(async (req, res) => {
  await ProductService.delete(Number.parseInt(req.params.id), req.user.id, req.ip);
  success(res, null, 'Produit supprimé');
});

module.exports = { getAll, getById, scan, getQrCode, getAlerts, create, update, updatePhoto, updateVariants, remove };
