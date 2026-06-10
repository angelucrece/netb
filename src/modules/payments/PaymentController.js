const asyncHandler = require('../../utils/asyncHandler');
const { success, created } = require('../../utils/ApiResponse');
const PaymentService = require('./PaymentService');

// Cette fonction enregistre un paiement deja confirme.
const registerManual = asyncHandler(async (req, res) => {
  const invoice = await PaymentService.registerManual(Number.parseInt(req.params.invoiceId || req.params.id, 10), req.body, req.user, req.ip);
  success(res, invoice, 'Paiement enregistre');
});

// Cette fonction initialise un paiement externe via un vrai provider.
const initiateExternal = asyncHandler(async (req, res) => {
  const transaction = await PaymentService.initiateExternal(Number.parseInt(req.params.invoiceId || req.params.id, 10), req.body, req.user, req.ip);
  created(res, transaction, 'Paiement externe initialise');
});

// Cette fonction interroge le provider et met a jour le statut local.
const refreshExternalStatus = asyncHandler(async (req, res) => {
  const transaction = await PaymentService.refreshExternalStatus(Number.parseInt(req.params.id, 10), req.user, req.ip);
  success(res, transaction, 'Statut paiement mis a jour');
});

module.exports = { registerManual, initiateExternal, refreshExternalStatus };
