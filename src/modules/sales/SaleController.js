const asyncHandler = require('../../utils/asyncHandler');
const { success, created, paginated } = require('../../utils/ApiResponse');
const SaleService = require('./SaleService');

const getAll = asyncHandler(async (req, res) => {
  const { sales, pagination } = await SaleService.getAll(req.query, req.user);
  paginated(res, sales, pagination);
});

const getById = asyncHandler(async (req, res) => {
  const sale = await SaleService.getById(Number.parseInt(req.params.id, 10), req.user);
  success(res, sale);
});

const create = asyncHandler(async (req, res) => {
  const sale = await SaleService.create(req.body, req.user, req.ip);
  created(res, sale, 'Vente creee');
});

const confirm = asyncHandler(async (req, res) => {
  const sale = await SaleService.confirm(Number.parseInt(req.params.id, 10), req.user, req.ip);
  success(res, sale, 'Vente confirmee');
});

const createDelivery = asyncHandler(async (req, res) => {
  const sale = await SaleService.createDelivery(Number.parseInt(req.params.id, 10), req.body, req.user, req.ip);
  created(res, sale, 'Bon de livraison cree');
});

const issueInvoice = asyncHandler(async (req, res) => {
  const invoice = await SaleService.issueInvoice(Number.parseInt(req.params.id, 10), req.user, req.ip);
  created(res, invoice, 'Facture emise');
});

const cancel = asyncHandler(async (req, res) => {
  const sale = await SaleService.cancel(Number.parseInt(req.params.id, 10), req.body.reason, req.user, req.ip);
  success(res, sale, 'Vente annulee');
});

const getDeliveries = asyncHandler(async (req, res) => {
  const { deliveries, pagination } = await SaleService.getDeliveries(req.query, req.user);
  paginated(res, deliveries, pagination);
});

const getDeliveryById = asyncHandler(async (req, res) => {
  const delivery = await SaleService.getDeliveryById(Number.parseInt(req.params.id, 10), req.user);
  success(res, delivery);
});

const startDelivery = asyncHandler(async (req, res) => {
  const delivery = await SaleService.startDelivery(Number.parseInt(req.params.id, 10), req.user, req.ip);
  success(res, delivery, 'Livraison demarree');
});

const validateDelivery = asyncHandler(async (req, res) => {
  const delivery = await SaleService.validateDelivery(Number.parseInt(req.params.id, 10), req.user, req.ip);
  success(res, delivery, 'Livraison validee');
});

const getInvoices = asyncHandler(async (req, res) => {
  const { invoices, pagination } = await SaleService.getInvoices(req.query, req.user);
  paginated(res, invoices, pagination);
});

const getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await SaleService.getInvoiceById(Number.parseInt(req.params.id, 10), req.user);
  success(res, invoice);
});

const registerPayment = asyncHandler(async (req, res) => {
  const invoice = await SaleService.registerPayment(Number.parseInt(req.params.id, 10), req.body, req.user, req.ip);
  success(res, invoice, 'Paiement enregistre');
});

const registerSalePayment = asyncHandler(async (req, res) => {
  const sale = await SaleService.registerSalePayment(Number.parseInt(req.params.id, 10), req.body, req.user, req.ip);
  success(res, sale, 'Paiement vente enregistre');
});

module.exports = {
  getAll,
  getById,
  create,
  confirm,
  createDelivery,
  issueInvoice,
  cancel,
  getDeliveries,
  getDeliveryById,
  startDelivery,
  validateDelivery,
  getInvoices,
  getInvoiceById,
  registerPayment,
  registerSalePayment,
};