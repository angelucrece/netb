// StockValidation.js
const ProductRepository = require('../products/ProductRepository');
const SiteRepository = require('../sites/siteRepository');

/**
 * Middleware pour valider les données de création ou modification de stock
 */
async function validateStock(req, res, next) {
  try {
    const { product_id, site_id, quantity, threshold } = req.body;

    // Vérifier les champs obligatoires
    if (!product_id || !site_id) {
      return res.status(400).json({
        success: false,
        message: 'product_id et site_id sont requis'
      });
    }

    if (quantity == null || threshold == null) {
      return res.status(400).json({
        success: false,
        message: 'quantity et threshold sont requis'
      });
    }

    // Vérifier les types
    if (isNaN(quantity) || isNaN(threshold) || quantity < 0 || threshold < 0) {
      return res.status(400).json({
        success: false,
        message: 'quantity et threshold doivent être des nombres positifs'
      });
    }

    // Vérifier que le produit existe
    const product = await ProductRepository.findById(product_id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Produit avec l'id ${product_id} introuvable`
      });
    }

    // Vérifier que le site existe
    const site = await SiteRepository.findById(site_id);
    if (!site) {
      return res.status(404).json({
        success: false,
        message: `Site avec l'id ${site_id} introuvable`
      });
    }

    // Tous les tests passent => next
    next();

  } catch (error) {
    console.error('Erreur validation stock:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la validation du stock'
    });
  }
}

/**
 * Middleware pour valider les donnees de transfert de stock
 * Verifie que les champs sont presents et que les sites et produits existent
 * Verifie que la quantite est un nombre positif
 */
async function validateStockTransfer(req, res, next) {
  try {
    const { productId, fromSiteId, toSiteId, quantity } = req.body;

    if (!productId || !fromSiteId || !toSiteId || quantity == null) {
      return res.status(400).json({
        success: false,
        message: 'productId, fromSiteId, toSiteId et quantity sont requis'
      });
    }

    if (isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'quantity doit être un nombre positif'
      });
    }

    const product = await ProductRepository.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Produit avec l'id ${productId} introuvable`
      });
    }

    const fromSite = await SiteRepository.findById(fromSiteId);
    if (!fromSite) {
      return res.status(404).json({
        success: false,
        message: `Site source avec l'id ${fromSiteId} introuvable`
      });
    }

    const toSite = await SiteRepository.findById(toSiteId);
    if (!toSite) {
      return res.status(404).json({
        success: false,
        message: `Site destination avec l'id ${toSiteId} introuvable`
      });
    }

    next();

  } catch (error) {
    console.error('Erreur validation transfert stock:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la validation du transfert de stock'
    });
  }
}

module.exports = { validateStock, validateStockTransfer };

