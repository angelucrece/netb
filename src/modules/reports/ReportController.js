const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/ApiResponse');
const ReportService = require('./ReportService');

const getDashboard = asyncHandler(async (req, res) => {
  const data = await ReportService.getDashboard(req.query.site_id);
  success(res, data);
});

const getStock = asyncHandler(async (req, res) => {
  const data = await ReportService.getStockReport(req.query);
  success(res, data);
});

const getMovements = asyncHandler(async (req, res) => {
  const data = await ReportService.getMovementsReport(req.query);
  success(res, data);
});

const getAlerts = asyncHandler(async (req, res) => {
  const data = await ReportService.getAlerts(req.query.site_id);
  success(res, data);
});

const getSitesStock = asyncHandler(async (req, res) => {
  const data = await ReportService.getSitesStockComparison();
  success(res, data);
});

const getInventoryReport = asyncHandler(async (req, res) => {
  const data = await ReportService.getInventoryReport(Number.parseInt(req.params.sessionId));
  success(res, data);
});

const exportStock = asyncHandler(async (req, res) => {
  const { format = 'excel' } = req.query;
  if (format === 'pdf') {
    const buf = await ReportService.exportStockPdf(req.query);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="stock.pdf"');
    return res.send(buf);
  }
  const buf = await ReportService.exportStockExcel(req.query);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="stock.xlsx"');
  res.send(buf);
});

const exportMovements = asyncHandler(async (req, res) => {
  const { format = 'excel' } = req.query;
  if (format === 'pdf') {
    const buf = await ReportService.exportMovementsPdf(req.query);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="mouvements.pdf"');
    return res.send(buf);
  }
  const buf = await ReportService.exportMovementsExcel(req.query);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="mouvements.xlsx"');
  res.send(buf);
});

module.exports = { getDashboard, getStock, getMovements, getAlerts, getSitesStock, getInventoryReport, exportStock, exportMovements };
