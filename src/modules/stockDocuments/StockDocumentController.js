const asyncHandler = require('../../utils/asyncHandler');
const { success, created, paginated } = require('../../utils/ApiResponse');
const StockDocumentService = require('./StockDocumentService');

const getAll = asyncHandler(async (req, res) => {
  const { documents, pagination } = await StockDocumentService.getAll(req.query);
  paginated(res, documents, pagination);
});

const getById = asyncHandler(async (req, res) => {
  const doc = await StockDocumentService.getById(Number.parseInt(req.params.id));
  success(res, doc);
});

const create = asyncHandler(async (req, res) => {
  const doc = await StockDocumentService.create(req.body, req.user.id);
  created(res, doc, 'Document créé');
});

const validate = asyncHandler(async (req, res) => {
  const doc = await StockDocumentService.validate(Number.parseInt(req.params.id), req.user.id);
  success(res, doc, 'Document validé');
});

module.exports = { getAll, getById, create, validate };
