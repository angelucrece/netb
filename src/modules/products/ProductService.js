
const logger = require('../../config/logger');
const ProductRepository = require('./ProductRepository');
const Product = require('./ProductModel'); 

// class ProductService {

//   static buildFilters(query) {
//     let where = 'WHERE p.active = true';
//     let params = [];
//     let i = 1;

//     if (query.search) {
//       where += ` AND (p.name ILIKE $${i} OR p.barcode ILIKE $${i})`;
//       params.push(`%${query.search}%`);
//       i++;
//     }

//     if (query.categoryId) {
//       where += ` AND p.category_id = $${i}`;
//       params.push(query.categoryId);
//       i++;
//     }

//     if (query.lowStock === 'true') {
//       where += ` AND p.quantity <= p.threshold`;
//     }

//     return { where, params };
//   }

//   static async getAll(query, userId) {
//     logger.info('Liste produits', { userId });

//     const { where, params } = this.buildFilters(query);

//     const page = parseInt(query.page || 1);
//     const limit = parseInt(query.limit || 20);
//     const offset = (page - 1) * limit;

//     params.push(limit, offset);

//     const [data, count] = await Promise.all([
//       ProductRepository.findAll(where, params),
//       ProductRepository.count(where, params.slice(0, -2))
//     ]);

//     return {
//       products: data.rows,
//       total: parseInt(count.rows[0].count),
//       page,
//       limit
//     };
//   }
//   static async getById(id, userId) {
//     logger.info('Récupération produit', { productId: id, userId });
//     const result = await ProductRepository.findById(id);
//     if (result.rows.length === 0) return null;
//     return result.rows[0];
//   }

//   // static async create(client, name, barcode, price, quantity, threshold, category_id, description,userId) {
//   //   logger.info('Création produit', { name, userId });

//   //   const exists = await ProductRepository.findByBarcode(barcode);
//   //   if (exists.rows.length) throw new Error('Code-barres existe déjà');

//   //   const result = await ProductRepository.create(client, name, barcode, price, quantity, threshold, category_id, description);
//   //   const product = result.rows[0];

//   //   // static async createCategory(client, name, description, site_id, userId) {
//   //   //     logger.info('Création catégorie', { name, userId });
//   //   //     const existing = await CategoryRepository.findByName(name);
//   //   //     if (existing.rows.length > 0) throw new Error('Nom catégorie déjà existant');
    
//   //   //     const result = await CategoryRepository.create(client, name, description, site_id);
    
//   //   //     await client.query(
//   //   //       'INSERT INTO logs (user_id, action, details) VALUES ($1, $2, $3)',
//   //   //       [userId, 'CREATE_CATEGORY', JSON.stringify({ categoryId: result.rows[0].id, name })]
//   //   //     );
    
//   //   //     logger.info('Catégorie créée', { categoryId: result.rows[0].id, userId });
//   //   //     return result.rows[0];
//   //   //   }
//   //   // LOG DB
//   //   await client.query(
//   //     `INSERT INTO logs (user_id, action, details) VALUES ($1,$2,$3)`,
//   //     [userId, 'CREATE_PRODUCT', JSON.stringify(product)]
//   //   );

//   //    // 🔥 VÉRIFICATION : S'assurer que product existe et a un ID
//   // if (!product || !product.id) {
//   //   logger.error('Échec création produit - pas d\'ID retourné', { product });
//   //   throw new Error('Erreur lors de la création du produit');
//   // }
//   //   // Mouvement initial
//   //   if (quantity > 0) {
//   //     await client.query(
//   //       `INSERT INTO movements (product_id,type,quantity,user_id,status)
//   //        VALUES ($1,'entry',$2,$3,'validated')`,
//   //       [product.id, quantity, userId]
//   //     );
//   //   }

//   //   return product;
//   // }

//   // static async update(client, id, name, barcode, price, quantity, threshold, category_id, description, old, userId) {
//   //   logger.info('Update produit', { id, userId });

//   //   const result = await ProductRepository.update(client, id, name, barcode, price, quantity, threshold, category_id, description,userId);

//   //   const diff = quantity - old.quantity;
//   //   if (diff !== 0) {
//   //     await client.query(
//   //       `INSERT INTO movements (product_id,type,quantity,user_id,status)
//   //        VALUES ($1,$2,$3,$4,'validated')`,
//   //       [id, diff > 0 ? 'entry' : 'exit', Math.abs(diff), userId]
//   //     );
//   //   }
//   //           const changes = {};
//   //       if (old.name !== name) changes.name = { old: old.name, new: name };
//   //       if (old.barcode !== barcode) changes.barcode = { old: old.barcode, new: barcode };
//   //       if (old.price !== price) changes.price = { old: old.price, new: price };
//   //       if (old.quantity !== name) changes.quantity = { old: old.quantity, new: quantity };
//   //       if (old.threshold !== threshold) changes.threshold = { old: old.threshold, new: threshold };
//   //       if (old.category_id !== category_id) changes.category_id = { old: old.category_id, new: category_id };
//   //       if (old.description !== description) changes.description = { old: old.description, new: description };
    
//   //        await client.query(
//   //         `INSERT INTO logs (user_id,action,details) VALUES ($1,$2,$3)`,
//   //           [userId, 'UPDATE_PRODUCT', JSON.stringify({ id })]
//   //        );

    
//   //       logger.info('produit modifié', {  id, userId });
//   //       return result.rows[0];
    
//   //   //     const updated = await CategoryRepository.update(client, id, name, description, site_id);
    
//   //       // const changes = {};
//   //       // if (old.name !== name) changes.name = { old: old.name, new: name };
//   //       // if (old.barcode !== barcode) changes.barcode = { old: old.barcode, new: barcode };
//   //       // if (old.price !== price) changes.price = { old: old.price, new: price };
//   //       // if (old.quantity !== name) changes.quantity = { old: old.quantity, new: quantity };
//   //       // if (old.threshold !== threshold) changes.threshold = { old: old.threshold, new: threshold };
//   //       // if (old.category_id !== category_id) changes.category_id = { old: old.category_id, new: category_id };
//   //       // if (old.description !== description) changes.description = { old: old.description, new: description };
    
//   //       // await client.query(
//   //       //   'INSERT INTO logs (user_id, action, details) VALUES ($1, $2, $3)',
//   //       //   [userId, 'UPDATE_CATEGORY', JSON.stringify({ categoryId: id, changes })]
//   //       // );
    
//   //       // logger.info('produit modifié', {  id, userId });
//   //       // return result.rows[0];

//   //   // static async updateCategory(client, id, name, description, site_id, oldCategory, userId) {
//   //   //     logger.info('Modification catégorie', { categoryId: id, userId });
    
//   //   //     const nameCheck = await CategoryRepository.findByName(name);
//   //   //     if (nameCheck.rows.some(r => r.id !== parseInt(id))) throw new Error('Nom catégorie déjà existant');
    
//   //   //     const updated = await CategoryRepository.update(client, id, name, description, site_id);
    
//   //   //     const changes = {};
//   //   //     if (oldCategory.name !== name) changes.name = { old: oldCategory.name, new: name };
//   //   //     if (oldCategory.description !== description) changes.description = { old: oldCategory.description, new: description };
//   //   //     if (oldCategory.site_id !== site_id) changes.site_id = { old: oldCategory.site_id, new: site_id };
    
//   //   //     await client.query(
//   //   //       'INSERT INTO logs (user_id, action, details) VALUES ($1, $2, $3)',
//   //   //       [userId, 'UPDATE_CATEGORY', JSON.stringify({ categoryId: id, changes })]
//   //   //     );
    
//   //   //     logger.info('Catégorie modifiée', { categoryId: id, userId });
//   //   //     return updated.rows[0];
//   //   //   }

//   //   // await client.query(
//   //   //   `INSERT INTO logs (user_id,action,details) VALUES ($1,$2,$3)`,
//   //   //   [userId, 'UPDATE_PRODUCT', JSON.stringify({ id })]
//   //   // );

//   //   // return result.rows[0];
//   // }


//   static async create(client, name, barcode, selling_price, purchase_price, quantity, threshold, category_id, description, photo, userId) {
//   logger.info('Création produit', { name, barcode, userId });

//   // Vérifier le code-barres
//   const exists = await ProductRepository.findByBarcode(barcode);
//   if (exists.rows.length) {
//     throw new Error('Code-barres existe déjà');
//   }

//   // Vérifier que le prix de vente >= prix d'achat
//   if (selling_price < purchase_price) {
//     throw new Error('Le prix de vente doit être supérieur ou égal au prix d\'achat');
//   }

//   const result = await ProductRepository.create(
//     client, name, barcode, selling_price, purchase_price, 
//     quantity, threshold, category_id, description, photo
//   );
  
//   const product = result.rows[0];

//   // Log DB
//   await client.query(
//     `INSERT INTO logs (user_id, action, details) VALUES ($1, $2, $3)`,
//     [userId, 'CREATE_PRODUCT', JSON.stringify(product)]
//   );

//   // Mouvement initial
//   if (quantity > 0) {
//     await client.query(
//       `INSERT INTO movements (product_id, type, quantity, user_id, status, motif, date)
//        VALUES ($1, 'entry', $2, $3, 'validated', $4, NOW())`,
//       [product.id, quantity, userId, 'Stock initial']
//     );
//   }

//   return product;
// }

//   static async delete(client, id, userId) {
//     logger.warn('Suppression produit', { id, userId });

//     await ProductRepository.softDelete(client, id);

//     await client.query(
//       `INSERT INTO logs (user_id,action,details) VALUES ($1,$2,$3)`,
//       [userId, 'DELETE_PRODUCT', JSON.stringify({ id })]
//     );
//   }

//   //recherche 

//   // ProductService.js - Ajoutez cette méthode

//   static async searchProducts(filters, userId) {
//     logger.info('Recherche produits', { filters, userId });
    
//     const [data, count] = await Promise.all([
//       ProductRepository.search(filters),
//       ProductRepository.countSearch(filters)
//     ]);
    
//     const page = parseInt(filters.page || 1);
//     const limit = parseInt(filters.limit || 20);
    
//     return {
//       products: data.rows,
//       total: parseInt(count.rows[0].count),
//       page,
//       limit,
//       totalPages: Math.ceil(parseInt(count.rows[0].count) / limit)
//     };
//   }

//   // Recherche par code-barres exact
//   static async getByBarcode(barcode, userId) {
//     logger.info('Recherche par code-barres', { barcode, userId });
//     const result = await ProductRepository.findByBarcode(barcode);
//     return result.rows[0] || null;
//   }

//   // Recherche par nom (auto-complétion)
//   static async autocomplete(searchTerm, limit = 10, userId) {
//     logger.info('Auto-complétion produits', { searchTerm, userId });
    
//     const result = await ProductRepository.search({
//       search: searchTerm,
//       limit,
//       page: 1,
//       sortBy: 'name'
//     });
    
//     return result.rows.map(p => ({
//       id: p.id,
//       name: p.name,
//       barcode: p.barcode,
//       price: p.price,
//       quantity: p.quantity
//     }));
//   }

//   // Recherche par nom
//   static async getByName(name, userId) {
//     logger.info('Recherche par nom', { name, userId });
    
//     const result = await ProductRepository.findByName(name);
    
//     return result.rows;
//   }
// }

// module.exports = ProductService;

// const logger = require('../../config/logger');
// const ProductRepository = require('./ProductRepository');

// const logger = require('../../config/logger');
// const ProductRepository = require('./ProductRepository');

class ProductService {

  static buildFilters(query) {
    let where = 'WHERE p.active = true';
    let params = [];
    let i = 1;

    if (query.search) {
      where += ` AND (p.name ILIKE $${i} OR p.barcode ILIKE $${i})`;
      params.push(`%${query.search}%`);
      i++;
    }

    if (query.categoryId) {
      where += ` AND p.category_id = $${i}`;
      params.push(query.categoryId);
      i++;
    }

    if (query.lowStock === 'true') {
      where += ` AND  p.threshold`;
    }

    return { where, params };
  }

  static async getAll(query, userId) {
    logger.info('Liste produits', { userId });

    const { where, params } = this.buildFilters(query);

    const page = parseInt(query.page || 1);
    const limit = parseInt(query.limit || 20);
    const offset = (page - 1) * limit;

    params.push(limit, offset);

    const [data, count] = await Promise.all([
      ProductRepository.findAll(where, params),
      ProductRepository.count(where, params.slice(0, -2))
    ]);

    return {
      products: data,
      total: parseInt(count.rows[0].count),
      page,
      limit
    };
  }

  static async getById(id, userId) {
    logger.info('Récupération produit', { productId: id, userId });
    return await ProductRepository.findById(id);
  }

  // ✅ CREATE AVEC PHOTO
  static async create(client, name, barcode, selling_price, purchase_price,  threshold, category_id, description, photo, userId) {
    logger.info('Création produit', { name, barcode, userId });

    // Vérifier le code-barres
    const exists = await ProductRepository.findByBarcode(barcode);
    if (exists) {
      throw new Error('Code-barres existe déjà');
    }

    // Vérifier que le prix de vente >= prix d'achat
    if (selling_price < purchase_price) {
      throw new Error('Le prix de vente doit être supérieur ou égal au prix d\'achat');
    }

    const product = await ProductRepository.create(
      client, name, barcode, selling_price, purchase_price, 
      threshold, category_id, description, photo
    );

    // Log DB
    await client.query(
      `INSERT INTO logs (user_id, action, details) VALUES ($1, $2, $3)`,
      [userId, 'CREATE_PRODUCT', JSON.stringify(product)]
    );

    // Mouvement initial
    // if (quantity > 0) {
    //   await client.query(
    //     `INSERT INTO movements (product_id, type, user_id, status, motif, date)
    //      VALUES ($1, 'entry', $2,  'validated', $3, NOW())`,
    //     [product.id, quantity, userId, 'Stock initial']
    //   );
    // }

    return product;
  }

  // ✅ UPDATE AVEC PHOTO
  static async update(client, id, name, barcode, selling_price, purchase_price, threshold, category_id, description, photo, oldProduct, userId) {
    logger.info('Update produit', { id, userId });

    // Vérifier si le code-barres change et existe déjà
    if (barcode !== oldProduct.barcode) {
      const exists = await ProductRepository.findByBarcode(barcode);
      if (exists) {
        throw new Error('Code-barres existe déjà');
      }
    }

    // Vérifier que le prix de vente >= prix d'achat
    if (selling_price < purchase_price) {
      throw new Error('Le prix de vente doit être supérieur ou égal au prix d\'achat');
    }

    const product = await ProductRepository.update(
      client, id, name, barcode, selling_price, purchase_price, 
      threshold, category_id, description, photo
    );

    // Gérer le mouvement de stock si la quantité a changé
    // const quantityDiff = quantity - oldProduct.quantity;
    // if (quantityDiff !== 0) {
    //   await client.query(
    //     `INSERT INTO movements (product_id, type, quantity, user_id, status, motif, date)
    //      VALUES ($1, $2, $3, $4, 'validated', $5, NOW())`,
    //     [id, quantityDiff > 0 ? 'entry' : 'exit', Math.abs(quantityDiff), userId, 'Ajustement stock']
    //   );
    // }

    // Log des changements
    const changes = {};
    if (oldProduct.name !== name) changes.name = { old: oldProduct.name, new: name };
    if (oldProduct.barcode !== barcode) changes.barcode = { old: oldProduct.barcode, new: barcode };
    if (oldProduct.selling_price !== selling_price) changes.selling_price = { old: oldProduct.selling_price, new: selling_price };
    if (oldProduct.purchase_price !== purchase_price) changes.purchase_price = { old: oldProduct.purchase_price, new: purchase_price };
    //if (oldProduct.quantity !== quantity) changes.quantity = { old: oldProduct.quantity, new: quantity };
    if (oldProduct.threshold !== threshold) changes.threshold = { old: oldProduct.threshold, new: threshold };
    if (oldProduct.category_id !== category_id) changes.category_id = { old: oldProduct.category_id, new: category_id };
    if (oldProduct.description !== description) changes.description = { old: oldProduct.description, new: description };
    if (oldProduct.photo !== photo) changes.photo = { old: oldProduct.photo, new: photo };

    await client.query(
      `INSERT INTO logs (user_id, action, details) VALUES ($1, $2, $3)`,
      [userId, 'UPDATE_PRODUCT', JSON.stringify({ id, changes })]
    );

    logger.info('Produit mis à jour', { productId: id, userId });
    return product;
  }

  // ✅ DELETE
  static async delete(client, id, userId) {
    logger.warn('Suppression produit', { id, userId });

    await ProductRepository.softDelete(client, id);

    await client.query(
      `INSERT INTO logs (user_id, action, details) VALUES ($1, $2, $3)`,
      [userId, 'DELETE_PRODUCT', JSON.stringify({ id })]
    );
  }

  // 🔍 RECHERCHE
  static async searchProducts(filters, userId) {
    logger.info('Recherche produits', { filters, userId });
    
    const result = await ProductRepository.search(filters);
    const total = await ProductRepository.countSearch(filters);
    
    const page = parseInt(filters.page || 1);
    const limit = parseInt(filters.limit || 20);
    
    return {
      products: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async getByBarcode(barcode, userId) {
    logger.info('Recherche par code-barres', { barcode, userId });
    return await ProductRepository.findByBarcode(barcode);
  }

  static async autocomplete(searchTerm, limit = 10, userId) {
    logger.info('Auto-complétion produits', { searchTerm, userId });
    
    const result = await ProductRepository.search({
      search: searchTerm,
      limit,
      page: 1,
      sortBy: 'name'
    });
    
    return result.rows.map(p => ({
      id: p.id,
      name: p.name,
      barcode: p.barcode,
      selling_price: p.selling_price,
      purchase_price: p.purchase_price,
      photo: p.photo
    }));
  }
}

module.exports = ProductService;
