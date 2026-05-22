const asyncHandler = require('../../utils/asyncHandler');
const { success, paginated } = require('../../utils/ApiResponse');
const ReceiptService = require('./ReceiptService');

const getAll = asyncHandler(async (req, res) => {
  const { receipts, pagination } = await ReceiptService.getAll(req.query);
  paginated(res, receipts, pagination);
});

const getById = asyncHandler(async (req, res) => {
  const receipt = await ReceiptService.getById(parseInt(req.params.id, 10));
  success(res, receipt);
});

const getByPaymentId = asyncHandler(async (req, res) => {
  const receipt = await ReceiptService.getByPaymentId(parseInt(req.params.paymentId, 10));
  success(res, receipt);
});

const exportPdf = asyncHandler(async (req, res) => {
  const receipt = await ReceiptService.getById(parseInt(req.params.id, 10));
  const buffer = await ReceiptService.renderPdf(receipt);
  const filename = `receipt-${receipt.reference}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
});

module.exports = { getAll, getById, getByPaymentId, exportPdf };
