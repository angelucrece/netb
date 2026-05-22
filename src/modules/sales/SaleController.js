const asyncHandler = require('../../utils/asyncHandler');
const { success, created, paginated } = require('../../utils/ApiResponse');
const SaleService = require('./SaleService');
const DeliveryService = require('../deliveries/DeliveryService');
const InvoiceService = require('../invoices/InvoiceService');
const PaymentService = require('../payments/PaymentService');

const getAll = asyncHandler(async (req, res) => {
  const { sales, pagination } = await SaleService.getAll(req.query);
  paginated(res, sales, pagination);
});

const getById = asyncHandler(async (req, res) => {
  const sale = await SaleService.getById(parseInt(req.params.id, 10));
  success(res, sale);
});

const create = asyncHandler(async (req, res) => {
  const sale = await SaleService.create(req.body, req.user.id, req.ip);
  created(res, sale, 'Vente creee');
});

const confirm = asyncHandler(async (req, res) => {
  const sale = await SaleService.confirm(parseInt(req.params.id, 10), req.user.id, req.ip);
  success(res, sale, 'Vente confirmee');
});

const createDelivery = asyncHandler(async (req, res) => {
  const sale = await DeliveryService.create(parseInt(req.params.id, 10), req.body, req.user.id, req.ip);
  created(res, sale, 'Bon de livraison cree');
});

const issueInvoice = asyncHandler(async (req, res) => {
  const invoice = await InvoiceService.issue(parseInt(req.params.id, 10), req.user.id, req.ip);
  created(res, invoice, 'Facture emise');
});

const cancel = asyncHandler(async (req, res) => {
  const sale = await SaleService.cancel(parseInt(req.params.id, 10), req.body.reason, req.user.id, req.ip);
  success(res, sale, 'Vente annulee');
});

const getDeliveries = asyncHandler(async (req, res) => {
  const { deliveries, pagination } = await DeliveryService.getAll(req.query);
  paginated(res, deliveries, pagination);
});

const getDeliveryById = asyncHandler(async (req, res) => {
  const delivery = await DeliveryService.getById(parseInt(req.params.id, 10));
  success(res, delivery);
});

const startDelivery = asyncHandler(async (req, res) => {
  const delivery = await DeliveryService.start(parseInt(req.params.id, 10), req.user.id, req.ip);
  success(res, delivery, 'Livraison demarree');
});

const validateDelivery = asyncHandler(async (req, res) => {
  const delivery = await DeliveryService.validate(parseInt(req.params.id, 10), req.user.id, req.ip);
  success(res, delivery, 'Livraison validee');
});

const getInvoices = asyncHandler(async (req, res) => {
  const { invoices, pagination } = await InvoiceService.getAll(req.query);
  paginated(res, invoices, pagination);
});

const getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await InvoiceService.getById(parseInt(req.params.id, 10));
  success(res, invoice);
});

const registerPayment = asyncHandler(async (req, res) => {
  const invoice = await PaymentService.registerManual(parseInt(req.params.id, 10), req.body, req.user, req.ip);
  success(res, invoice, 'Paiement enregistre');
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
};
