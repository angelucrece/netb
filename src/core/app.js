const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const morgan  = require('morgan');
const path    = require('node:path');

const { generalLimiter } = require('../middleware/rateLimiter');
const ApiError = require('../utils/ApiError');
const logger   = require('../config/logger');
const setupSwagger = require('../config/swagger');

const app = express();

// ── Sécurité & parsing ──────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

// ── Rate limiter global ─────────────────────────────────────
app.use(generalLimiter);

// ── Fichiers statiques (photos produits) ───────────────────
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// ── Swagger ────────────────────────────────────────────────
setupSwagger(app);

// ── Health check ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'NethaStock API opérationnelle', timestamp: new Date() });
});

// ── Routes métier ──────────────────────────────────────────
app.use('/api/v1/auth',       require('../modules/auth/AuthRoute'));
app.use('/api/v1/roles',      require('../modules/roles/RoleRoute'));
app.use('/api/v1/sites',      require('../modules/sites/SiteRoute'));
app.use('/api/v1/users',      require('../modules/users/UserRoute'));
app.use('/api/v1/categories', require('../modules/categories/CategoryRoute'));
app.use('/api/v1/products',   require('../modules/products/ProductRoute'));
app.use('/api/v1/stocks',     require('../modules/stocks/StockRoute'));
app.use('/api/v1/movements',      require('../modules/stockMovement/StockMovementRoute'));
app.use('/api/v1/inventory',      require('../modules/inventory/InventoryRoute'));
app.use('/api/v1/documents',      require('../modules/stockDocuments/StockDocumentRoute'));
app.use('/api/v1/clients',        require('../modules/clients/ClientRoute'));
app.use('/api/v1/suppliers',      require('../modules/suppliers/SupplierRoute'));
app.use('/api/v1/purchases',      require('../modules/purchases/PurchaseRoute'));
app.use('/api/v1/sales',          require('../modules/sales/SaleRoute'));
app.use('/api/v1/cash',           require('../modules/cash/CashRoute'));
app.use('/api/v1/reports',        require('../modules/reports/ReportRoute'));
app.use('/api/v1/notifications',  require('../modules/notifications/NotificationRoute'));
app.use('/api/v1/audit-logs',     require('../modules/auditLogs/AuditLogRoute'));

// ── 404 ────────────────────────────────────────────────────
app.use((req, res, next) => {
  next(ApiError.notFound(`Route introuvable : ${req.method} ${req.originalUrl}`));
});

// ── Handler d'erreur global ────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status  = err.statusCode || 500;
  const message = err.message    || 'Erreur serveur';

  if (status >= 500) {
    logger.error('[App] Erreur serveur', { status, message, stack: err.stack });
  } else {
    logger.warn('[App] Erreur client', { status, message });
  }

  res.status(status).json({
    success: false,
    message,
    errors: err.details || [],
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

module.exports = app;