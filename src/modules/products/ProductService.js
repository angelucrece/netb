
const QRCode    = require('qrcode');
const path      = require('node:path');
const fs        = require('node:fs');
const crypto    = require('node:crypto'); // CSPRNG natif Node.js
const ProductRepository = require('./ProductRepository');
const ApiError  = require('../../utils/ApiError');
const paginate  = require('../../utils/paginate');
const { logAction } = require('../../utils/auditLog');
const logger    = require('../../config/logger');

// Dossier QR codes
const QR_DIR = path.join(__dirname, '../../../uploads/qrcodes');
if (!fs.existsSync(QR_DIR)) fs.mkdirSync(QR_DIR, { recursive: true });

// Génère un SKU unique : REF-YYYY-XXXXXX
// crypto.randomBytes : CSPRNG natif — résistant à la prédiction (recommandé par SonarCloud)
const generateSku = () => {
  const year = new Date().getFullYear();
  // 3 octets → 6 caractères base36 en majuscules, espace de 16M+ valeurs
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `REF-${year}-${rand}`;
};

// Génère et sauvegarde le QR code, retourne l'URL relative
const generateQR = async (sku) => {
  const filename = `qr-${sku}.png`;
  const filepath = path.join(QR_DIR, filename);
  await QRCode.toFile(filepath, sku, { width: 300 });
  return `/uploads/qrcodes/${filename}`;
};

class ProductService {

  static async getAll(filters) {
    const { page = 1, limit = 20, ...rest } = filters;
    const pg = paginate(page, limit, 0);
    const [rows, total] = await Promise.all([
      ProductRepository.findAll({ ...rest, limit: pg.limit, offset: pg.offset }),
      ProductRepository.count(rest),
    ]);
    return { products: rows, pagination: paginate(page, limit, total) };
  }

  static async getById(id) {
    const p = await ProductRepository.findById(id);
    if (!p) throw ApiError.notFound('Produit introuvable');
    return p;
  }

  static async getByBarcode(barcode) {
    const p = await ProductRepository.findByBarcode(barcode);
    if (!p) throw ApiError.notFound('Produit introuvable');
    return p;
  }

  static async getQrCode(id) {
    const p = await this.getById(id);
    // Générer à la volée en base64 si pas de fichier
    const dataUrl = await QRCode.toDataURL(p.sku, { width: 300 });
    return { sku: p.sku, qrCode: dataUrl };
  }

  static async getAlerts(site_id) {
    return await ProductRepository.findAlerts(site_id);
  }

  static async create(data, photoPath, userId, ip) {
    // SKU unique
    let sku;
    do { sku = generateSku(); } while (await ProductRepository.findBySku(sku));

    // Barcode unique si fourni
    if (data.barcode) {
      const exists = await ProductRepository.findByBarcode(data.barcode);
      if (exists) throw ApiError.conflict('Code-barres déjà utilisé');
    }

    const qr_code_url = await generateQR(sku);
    const photo_url   = photoPath ? `/uploads/products/${path.basename(photoPath)}` : null;

    const product = await ProductRepository.create({ ...data, sku, qr_code_url, photo_url });
    await logAction({ userId, action: 'CREATE_PRODUCT', entityType: 'product', entityId: product.id, newValue: { sku, name: data.name }, ip });
    logger.info('[Products] Produit créé', { sku, userId });
    return product;
  }

  static async update(id, data, userId, ip) {
    const old = await this.getById(id);
    if (data.barcode && data.barcode !== old.barcode) {
      const exists = await ProductRepository.findByBarcode(data.barcode);
      if (exists) throw ApiError.conflict('Code-barres déjà utilisé');
    }
    const product = await ProductRepository.update(id, data);
    await logAction({ userId, action: 'UPDATE_PRODUCT', entityType: 'product', entityId: id, oldValue: old, newValue: data, ip });
    return product;
  }

  static async updatePhoto(id, photoPath, userId) {
    await this.getById(id);
    const photo_url = `/uploads/products/${path.basename(photoPath)}`;
    return await ProductRepository.updatePhoto(id, photo_url);
  }

  static async updateVariants(id, variants, userId) {
    await this.getById(id);
    await ProductRepository.upsertVariants(id, variants);
    return this.getById(id);
  }

  static async delete(id, userId, ip) {
    await this.getById(id);
    await ProductRepository.softDelete(id);
    await logAction({ userId, action: 'DELETE_PRODUCT', entityType: 'product', entityId: id, ip });
  }
}

module.exports = ProductService;