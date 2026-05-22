const asyncHandler = require('../../utils/asyncHandler');
const { success, created, paginated } = require('../../utils/ApiResponse');
const InvoiceService = require('./InvoiceService');

// Cette fonction renvoie toutes les factures avec filtres.
const getAll = asyncHandler(async (req, res) => {
  const { invoices, pagination } = await InvoiceService.getAll(req.query);
  paginated(res, invoices, pagination);
});

// Cette fonction renvoie une facture precise.
const getById = asyncHandler(async (req, res) => {
  const invoice = await InvoiceService.getById(parseInt(req.params.id, 10));
  success(res, invoice);
});

// Cette fonction emet une facture pour une vente.
const issue = asyncHandler(async (req, res) => {
  const invoice = await InvoiceService.issue(parseInt(req.params.saleId || req.params.id, 10), req.user.id, req.ip);
  created(res, invoice, 'Facture emise');
});

module.exports = { getAll, getById, issue };
