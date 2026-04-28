const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const ReportRepository = require('./ReportRepository');
const InventoryRepository = require('../inventory/InventoryRepository');
const ApiError = require('../../utils/ApiError');

class ReportService {

  static async getDashboard(site_id) {
    return await ReportRepository.getDashboard(site_id || null);
  }

  static async getStockReport(filters) {
    return await ReportRepository.getStockReport(filters);
  }

  static async getMovementsReport(filters) {
    return await ReportRepository.getMovementsReport(filters);
  }

  static async getAlerts(site_id) {
    const { rows } = await require('../../config/database').query(
      `SELECT p.id, p.name, p.sku, ps.quantity, ps.min_stock, s.name AS site_name
       FROM product_stocks ps
       JOIN products p ON p.id = ps.product_id AND p.active = true
       JOIN sites s ON s.id = ps.site_id
       WHERE ps.quantity <= ps.min_stock ${site_id ? 'AND ps.site_id = $1' : ''}
       ORDER BY ps.quantity ASC`,
      site_id ? [site_id] : []
    );
    return rows;
  }

  static async getSitesStockComparison() {
    return await ReportRepository.getSitesStockComparison();
  }

  static async getInventoryReport(session_id) {
    const session = await InventoryRepository.findSessionById(session_id);
    if (!session) throw ApiError.notFound('Session introuvable');
    const items = await ReportRepository.getInventoryReport(session_id);
    return { session, items };
  }

  // ── Export Excel ─────────────────────────────────────────
  static async exportStockExcel(filters) {
    const rows = await ReportRepository.getStockReport(filters);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Stock');

    ws.columns = [
      { header: 'SKU',        key: 'sku',       width: 18 },
      { header: 'Produit',    key: 'name',       width: 30 },
      { header: 'Catégorie',  key: 'category',   width: 20 },
      { header: 'Site',       key: 'site_name',  width: 20 },
      { header: 'Quantité',   key: 'quantity',   width: 12 },
      { header: 'Min',        key: 'min_stock',  width: 10 },
      { header: 'Emplacement',key: 'location',   width: 15 },
      { header: 'Alerte',     key: 'is_alert',   width: 10 },
    ];

    ws.getRow(1).font = { bold: true };
    rows.forEach(r => {
      const row = ws.addRow(r);
      if (r.is_alert) row.getCell('is_alert').fill = {
        type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' },
      };
    });

    return wb.xlsx.writeBuffer();
  }

  static async exportMovementsExcel(filters) {
    const rows = await ReportRepository.getMovementsReport(filters);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Mouvements');

    ws.columns = [
      { header: 'ID',       key: 'id',           width: 8 },
      { header: 'Type',     key: 'type',          width: 12 },
      { header: 'Produit',  key: 'product_name',  width: 30 },
      { header: 'Site',     key: 'site_name',     width: 20 },
      { header: 'Quantité', key: 'quantity',      width: 12 },
      { header: 'Statut',   key: 'status',        width: 12 },
      { header: 'Utilisateur', key: 'user_name',  width: 25 },
      { header: 'Date',     key: 'created_at',    width: 20 },
    ];

    ws.getRow(1).font = { bold: true };
    rows.forEach(r => ws.addRow(r));
    return wb.xlsx.writeBuffer();
  }

  // ── Export PDF ───────────────────────────────────────────
  static async exportStockPdf(filters) {
    const rows = await ReportRepository.getStockReport(filters);
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(16).text('Rapport de Stock – NethaStock', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Généré le : ${new Date().toLocaleString('fr-FR')}`);
      doc.moveDown();

      rows.forEach(r => {
        const alert = r.is_alert ? ' ⚠ ALERTE' : '';
        doc.fontSize(9).text(
          `${r.sku} | ${r.name} | ${r.site_name} | Qté: ${r.quantity} | Min: ${r.min_stock}${alert}`
        );
      });

      doc.end();
    });
  }

  static async exportMovementsPdf(filters) {
    const rows = await ReportRepository.getMovementsReport(filters);
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(16).text('Rapport des Mouvements – NethaStock', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Généré le : ${new Date().toLocaleString('fr-FR')}`);
      doc.moveDown();

      rows.forEach(r => {
        doc.fontSize(9).text(
          `#${r.id} | ${r.type.toUpperCase()} | ${r.product_name} | ${r.site_name} | Qté: ${r.quantity} | ${r.status} | ${new Date(r.created_at).toLocaleDateString('fr-FR')}`
        );
      });

      doc.end();
    });
  }
}

module.exports = ReportService;
