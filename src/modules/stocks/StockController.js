const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/ApiResponse');
const StockService = require('./StockService');

const getStocks = asyncHandler(async (req, res) => {
  const stocks = await StockService.getStocks(req.query);
  success(res, stocks);
});

const getByProductAndSite = asyncHandler(async (req, res) => {
  const stock = await StockService.getByProductAndSite(
    parseInt(req.params.productId),
    parseInt(req.params.siteId)
  );
  success(res, stock);
});

const transfer = asyncHandler(async (req, res) => {
  const result = await StockService.transfer({ ...req.body, userId: req.user.id });
  success(res, result, 'Transfert effectué');
});

module.exports = { getStocks, getByProductAndSite, transfer };
