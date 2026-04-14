
// const ProductService = require('./ProductService');
// const ProductRepository = require('./ProductRepository');
// const db = require('../../config/database');
// const logger = require('../../config/logger');

// class ProductController {

//   static async getAll(req, res) {
//     try {
//       const result = await ProductService.getAll(req.query, req.user?.id);

//       res.json({
//         success: true,
//         data: result.products,
//         pagination: result
//       });

//     } catch (e) {
//       logger.error('GET products error', { error: e.message });
//       res.status(500).json({ success: false });
//     }
//   }

//   static async getById(req, res) {
//     try {
//       const product = await ProductService.getById(req.params.id, req.user?.id);

//       if (!product) {
//         return res.status(404).json({
//           success: false,
//           message: 'Produit non trouvé'
//         });
//       }

//       res.json({ success: true, data: product });

//     } catch (e) {
//       logger.error('GET product error', { error: e.message });
//       res.status(500).json({ success: false });
//     }
//   }

//   static async create(req, res) {
//     try {
//       const result = await db.transaction(client =>
//         ProductService.create(
//           // name, barcode, price, quantity, threshold, category_id, description
//           client, 
//           req.body.name,
//           req.body.barcode,
//           req.body.price,
//           req.body.quantity,
//           req.body.threshold,
//           req.body.category_id, 
//           req.body.description,
//           req.user.id
//         )
//       );

//       res.status(201).json({ success: true, data: result });

//     } catch (e) {
//       logger.error('CREATE product error', { error: e.message });
//       res.status(500).json({ success: false, message: e.message });
//     }
//   }

  

//   static async update(req, res) {
//     try {
//       const old = await ProductRepository.findById(req.params.id);
//       if (!old.rows.length) return res.status(404).json({ success: false });

//       const result = await db.transaction(client =>
//         ProductService.update(
//           client, 
//           req.params.id, 
//           req.body.name,
//           req.body.barcode, 
//           req.body.price,
//           req.body.quantity,
//           req.body.threshold,
//           req.body.category_id, 
//           req.body.description,
//           old.rows[0], 
//           req.user.id
//         )
//       );

//       res.json({ success: true, data: result });

//     } catch (e) {
//       logger.error('UPDATE product error', { error: e.message });
//       res.status(500).json({ success: false });
//     }
//   }

//   static async delete(req, res) {
//     try {
//       await db.transaction(client =>
//         ProductService.delete(client, req.params.id, req.user.id)
//       );

//       res.json({ success: true });

//     } catch (e) {
//       logger.error('DELETE product error', { error: e.message });
//       res.status(500).json({ success: false });
//     }
//   }

//   // Recherche par nom
//   static async getByName(req, res) {
//     try {
//       const { name } = req.params;
      
//       const products = await ProductService.getByName(name, req.user?.id);
      
//       res.json({
//         success: true,
//         data: products,
//         count: products.length
//       });
//     } catch (e) {
//       logger.error('GET product by name error', { error: e.message });
//       res.status(500).json({ 
//         success: false, 
//         message: 'Erreur lors de la recherche' 
//       });
//     }
//   }

//   // Recherche avancée
//   static async search(req, res) {
//     try {
//       const filters = {
//         search: req.query.q || req.query.search,
//         category_id: req.query.category_id,
//         site_id: req.query.site_id,
//         lowStock: req.query.lowStock,
//         minPrice: req.query.minPrice,
//         maxPrice: req.query.maxPrice,
//         minQuantity: req.query.minQuantity,
//         sortBy: req.query.sortBy,
//         sortOrder: req.query.sortOrder,
//         page: req.query.page,
//         limit: req.query.limit
//       };
      
//       const result = await ProductService.searchProducts(filters, req.user?.id);
      
//       res.json({
//         success: true,
//         data: result.products,
//         pagination: {
//           page: result.page,
//           limit: result.limit,
//           total: result.total,
//           totalPages: result.totalPages
//         }
//       });
//     } catch (e) {
//       logger.error('SEARCH products error', { error: e.message });
//       res.status(500).json({ 
//         success: false, 
//         message: 'Erreur lors de la recherche' 
//       });
//     }
//   }

//   // Auto-complétion
//   static async autocomplete(req, res) {
//     try {
//       const { q } = req.query;
//       const limit = parseInt(req.query.limit || 10);
      
//       if (!q || q.length < 2) {
//         return res.json({
//           success: true,
//           data: [],
//           message: 'Terme de recherche trop court'
//         });
//       }
      
//       const results = await ProductService.autocomplete(q, limit, req.user?.id);
      
//       res.json({
//         success: true,
//         data: results
//       });
//     } catch (e) {
//       logger.error('AUTOCOMPLETE products error', { error: e.message });
//       res.status(500).json({ 
//         success: false, 
//         message: 'Erreur lors de l\'auto-complétion' 
//       });
//     }
//   }

//   // Recherche par code-barres
//   static async getByBarcode(req, res) {
//     try {
//       const { barcode } = req.params;
      
//       const product = await ProductService.getByBarcode(barcode, req.user?.id);
      
//       if (!product) {
//         return res.status(404).json({
//           success: false,
//           message: 'Produit non trouvé'
//         });
//       }
      
//       res.json({
//         success: true,
//         data: product
//       });
//     } catch (e) {
//       logger.error('GET product by barcode error', { error: e.message });
//       res.status(500).json({ 
//         success: false, 
//         message: 'Erreur lors de la recherche' 
//       });
//     }
//   }
// }

const db = require('../../config/database');
const logger = require('../../config/logger');
const ProductService = require('./ProductService');
const ProductRepository = require('./ProductRepository');
const fs = require('fs');
const path = require('path');

class ProductController {

  static async getAll(req, res) {
    try {
      const result = await ProductService.getAll(req.query, req.user?.id);

      res.json({
        success: true,
        data: result.products,
        pagination: result
      });

    } catch (e) {
      logger.error('GET products error', { error: e.message });
      res.status(500).json({ success: false });
    }
  }

  static async getById(req, res) {
    try {
      const product = await ProductService.getById(req.params.id, req.user?.id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé'
        });
      }

      res.json({ success: true, data: product });

    } catch (e) {
      logger.error('GET product error', { error: e.message });
      res.status(500).json({ success: false });
    }
  }

  // ✅ CREATE AVEC PHOTO
  static async create(req, res) {
    try {
      // Récupérer les données
      const { 
        name, 
        barcode, 
        selling_price, 
        purchase_price, 
        threshold, 
        category_id, 
        description 
      } = req.body;

      // Récupérer la photo uploadée
      const photo = req.file ? `/uploads/products/${req.file.filename}` : null;

      // Validation
      if (!name || !barcode) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'Le nom et le code-barres sont requis'
        });
      }

      const result = await db.transaction(async (client) => {
        return ProductService.create(
          client,
          name,
          barcode,
          parseFloat(selling_price) || 0,
          parseFloat(purchase_price) || 0,
          parseInt(threshold) || 10,
          category_id ? parseInt(category_id) : null,
          description || null,
          photo,
          req.user.id
        );
      });

      res.status(201).json({ 
        success: true, 
        data: result,
        message: 'Produit créé avec succès'
      });

    } catch (e) {
      // Supprimer le fichier en cas d'erreur
      if (req.file) fs.unlinkSync(req.file.path);
      logger.error('CREATE product error', { error: e.message });
      res.status(500).json({ success: false, message: e.message });
    }
  }

  // ✅ UPDATE AVEC PHOTO
  static async update(req, res) {
    try {
      const old = await ProductRepository.findById(req.params.id);
      if (!old) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(404).json({ success: false, message: 'Produit non trouvé' });
      }

      const { 
        name, 
        barcode, 
        selling_price, 
        purchase_price, 
        threshold, 
        category_id, 
        description 
      } = req.body;

      // Gestion de la photo
      let photo = old.photo;
      if (req.file) {
        // Supprimer l'ancienne photo
        if (old.photo) {
          const oldPath = path.join(__dirname, '../../../', old.photo);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        photo = `/uploads/products/${req.file.filename}`;
      }

      const result = await db.transaction(async (client) => {
        return ProductService.update(
          client,
          parseInt(req.params.id),
          name,
          barcode,
          parseFloat(selling_price) || 0,
          parseFloat(purchase_price) || 0,
          parseInt(threshold) || 10,
          category_id ? parseInt(category_id) : null,
          description || null,
          photo,
          old,
          req.user.id
        );
      });

      res.json({ 
        success: true, 
        data: result,
        message: 'Produit mis à jour avec succès'
      });

    } catch (e) {
      if (req.file) fs.unlinkSync(req.file.path);
      logger.error('UPDATE product error', { error: e.message });
      res.status(500).json({ success: false, message: e.message });
    }
  }

  // ✅ DELETE AVEC SUPPRESSION DE LA PHOTO
  static async delete(req, res) {
    try {
      const product = await ProductRepository.findById(req.params.id);
      
      await db.transaction(async (client) => {
        await ProductService.delete(client, req.params.id, req.user.id);
      });

      // Supprimer la photo
      if (product && product.photo) {
        const photoPath = path.join(__dirname, '../../../', product.photo);
        if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
      }

      res.json({ success: true, message: 'Produit supprimé avec succès' });

    } catch (e) {
      logger.error('DELETE product error', { error: e.message });
      res.status(500).json({ success: false, message: e.message });
    }
  }

  // Recherche par nom
  static async getByName(req, res) {
    try {
      const { name } = req.params;
      
      const products = await ProductService.getByName(name, req.user?.id);
      
      res.json({
        success: true,
        data: products,
        count: products.length
      });
    } catch (e) {
      logger.error('GET product by name error', { error: e.message });
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la recherche' 
      });
    }
  }

  // 🔍 RECHERCHE AVANCÉE
  static async search(req, res) {
    try {
      const filters = {
        search: req.query.q || req.query.search,
        category_id: req.query.category_id,
        site_id: req.query.site_id,
        lowStock: req.query.lowStock,
        minSellingPrice: req.query.minSellingPrice,
        maxSellingPrice: req.query.maxSellingPrice,
        minPurchasePrice: req.query.minPurchasePrice,
        maxPurchasePrice: req.query.maxPurchasePrice,
        minMargin: req.query.minMargin,
        maxMargin: req.query.maxMargin,
        hasPhoto: req.query.hasPhoto,
        sort: req.query.sort,
        page: req.query.page,
        limit: req.query.limit
      };
      
      const result = await ProductService.searchProducts(filters, req.user?.id);
      
      res.json({
        success: true,
        data: result.products,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        }
      });
    } catch (e) {
      logger.error('SEARCH products error', { error: e.message });
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la recherche' 
      });
    }
  }

  // Auto-complétion
  static async autocomplete(req, res) {
    try {
      const { q } = req.query;
      const limit = parseInt(req.query.limit || 10);
      
      if (!q || q.length < 2) {
        return res.json({
          success: true,
          data: [],
          message: 'Terme de recherche trop court'
        });
      }
      
      const results = await ProductService.autocomplete(q, limit, req.user?.id);
      
      res.json({
        success: true,
        data: results
      });
    } catch (e) {
      logger.error('AUTOCOMPLETE products error', { error: e.message });
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de l\'auto-complétion' 
      });
    }
  }

  // Recherche par code-barres
  static async getByBarcode(req, res) {
    try {
      const { barcode } = req.params;
      
      const product = await ProductService.getByBarcode(barcode, req.user?.id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé'
        });
      }
      
      res.json({
        success: true,
        data: product
      });
    } catch (e) {
      logger.error('GET product by barcode error', { error: e.message });
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la recherche' 
      });
    }
  }
}

// module.exports = ProductController;
module.exports = ProductController;