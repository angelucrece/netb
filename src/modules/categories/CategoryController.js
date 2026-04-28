const asyncHandler = require('../../utils/asyncHandler');
const { success, created, paginated } = require('../../utils/ApiResponse');
const CategoryService = require('./CategoryService');

const getAll = asyncHandler(async (req, res) => {
  const { categories, pagination } = await CategoryService.getAll(req.query);
  paginated(res, categories, pagination);
});

const getById = asyncHandler(async (req, res) => {
  const cat = await CategoryService.getById(parseInt(req.params.id));
  success(res, cat);
});

const create = asyncHandler(async (req, res) => {
  const cat = await CategoryService.create(req.body, req.user.id, req.ip);
  created(res, cat, 'Catégorie créée');
});

const update = asyncHandler(async (req, res) => {
  const cat = await CategoryService.update(parseInt(req.params.id), req.body, req.user.id, req.ip);
  success(res, cat, 'Catégorie mise à jour');
});

const remove = asyncHandler(async (req, res) => {
  await CategoryService.delete(parseInt(req.params.id), req.user.id, req.ip);
  success(res, null, 'Catégorie supprimée');
});

module.exports = { getAll, getById, create, update, remove };
