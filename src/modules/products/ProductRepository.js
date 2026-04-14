
//const db = require('../../config/database');

// class ProductRepository {

//   static async findAll(whereClause, params) {
//     const query = `
//       SELECT 
//         p.*, c.name as category_name,
//         (p.quantity <= p.threshold) as low_stock
//       FROM products p
//       LEFT JOIN categories c ON p.category_id = c.id
//       ${whereClause}
//       ORDER BY p.name
//       LIMIT $${params.length - 1} OFFSET $${params.length}
//     `;
//     return db.query(query, params);
//   }

//   static async count(whereClause, params) {
//     return db.query(`SELECT COUNT(*) FROM products p ${whereClause}`, params);
//   }

//   static async findById(id) {
//     return db.query(
//       `SELECT * FROM products WHERE id = $1 AND active = true`,
//       [id]
//     );
//   }

//   static async findByBarcode(barcode) {
//     return db.query(
//       `SELECT * FROM products WHERE barcode = $1 AND active = true`,
//       [barcode]
//     );
//   }

//   static async create(client, name, barcode, price, quantity, threshold, category_id, description) {
//     const query = `
//       INSERT INTO products (name, barcode, price, quantity, threshold, category_id, description, active)
//       VALUES ($1,$2,$3,$4,$5,$6,$7,true)
//       RETURNING id, name, barcode, price, quantity, threshold, category_id, description,active, created_at`
//       ;
//     return client.query(query, [name, barcode, price, quantity, threshold, category_id, description])
//   }

//   static async update(client, id, name, barcode, price, quantity, threshold, category_id, description) {
//     const query = `
//       UPDATE products
//       SET name=$1, barcode=$2, price=$3, quantity=$4, threshold=$5,
//           category_id=$6, description=$7, updated_at=NOW()
//       WHERE id=$8
//       RETURNING name,barcode,price,quantity,threshold ,category_id ,description, id`
//       ;
//     return client.query(query, [name, barcode, price, quantity, threshold, category_id, description,id])
    
//   }

//   static async softDelete(client, id) {
//     return client.query(
//       `UPDATE products SET active=false WHERE id=$1`,
//       [id]
//     );
//   }


//   //recherche

//   static async search(filters) {
//     let query = `
//       SELECT 
//         p.*, 
//         c.name as category_name,
//         (p.quantity <= p.threshold) as low_stock
//       FROM products p
//       LEFT JOIN categories c ON p.category_id = c.id
//       WHERE p.active = true
//     `;
    
//     const params = [];
//     let paramIndex = 1;
    
//     // Recherche par terme (nom ou code-barres)
//     if (filters.search) {
//       query += ` AND (p.name ILIKE $${paramIndex} OR p.barcode ILIKE $${paramIndex})`;
//       params.push(`%${filters.search}%`);
//       paramIndex++;
//     }
    
//     // Filtre par catégorie
//     if (filters.category_id) {
//       query += ` AND p.category_id = $${paramIndex}`;
//       params.push(filters.category_id);
//       paramIndex++;
//     }
    
//     // Filtre par site (via la catégorie)
//     if (filters.site_id) {
//       query += ` AND c.site_id = $${paramIndex}`;
//       params.push(filters.site_id);
//       paramIndex++;
//     }
    
//     // Filtre low stock
//     if (filters.lowStock === 'true') {
//       query += ` AND p.quantity <= p.threshold`;
//     }
    
//     // Prix minimum
//     if (filters.minPrice) {
//       query += ` AND p.price >= $${paramIndex}`;
//       params.push(parseFloat(filters.minPrice));
//       paramIndex++;
//     }
    
//     // Prix maximum
//     if (filters.maxPrice) {
//       query += ` AND p.price <= $${paramIndex}`;
//       params.push(parseFloat(filters.maxPrice));
//       paramIndex++;
//     }
    
//     // Quantité minimum
//     if (filters.minQuantity) {
//       query += ` AND p.quantity >= $${paramIndex}`;
//       params.push(parseInt(filters.minQuantity));
//       paramIndex++;
//     }
    
//     // Tri
//     const sortBy = filters.sortBy || 'name';
//     const sortOrder = filters.sortOrder === 'desc' ? 'DESC' : 'ASC';
//     query += ` ORDER BY p.${sortBy} ${sortOrder}`;
    
//     // Pagination
//     const page = parseInt(filters.page || 1);
//     const limit = parseInt(filters.limit || 20);
//     const offset = (page - 1) * limit;
    
//     query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
//     params.push(limit, offset);
    
//     return db.query(query, params);
//   }

//   static async countSearch(filters) {
//     let query = `
//       SELECT COUNT(*) 
//       FROM products p
//       LEFT JOIN categories c ON p.category_id = c.id
//       WHERE p.active = true
//     `;
    
//     const params = [];
//     let paramIndex = 1;
    
//     if (filters.search) {
//       query += ` AND (p.name ILIKE $${paramIndex} OR p.barcode ILIKE $${paramIndex})`;
//       params.push(`%${filters.search}%`);
//       paramIndex++;
//     }
    
//     if (filters.category_id) {
//       query += ` AND p.category_id = $${paramIndex}`;
//       params.push(filters.category_id);
//       paramIndex++;
//     }
    
//     if (filters.site_id) {
//       query += ` AND c.site_id = $${paramIndex}`;
//       params.push(filters.site_id);
//       paramIndex++;
//     }
    
//     if (filters.lowStock === 'true') {
//       query += ` AND p.quantity <= p.threshold`;
//     }
    
//     if (filters.minPrice) {
//       query += ` AND p.price >= $${paramIndex}`;
//       params.push(parseFloat(filters.minPrice));
//       paramIndex++;
//     }
    
//     if (filters.maxPrice) {
//       query += ` AND p.price <= $${paramIndex}`;
//       params.push(parseFloat(filters.maxPrice));
//       paramIndex++;
//     }
    
//     if (filters.minQuantity) {
//       query += ` AND p.quantity >= $${paramIndex}`;
//       params.push(parseInt(filters.minQuantity));
//       paramIndex++;
//     }
    
//     return db.query(query, params);
//   }

//     // Recherche par nom (partiel)
//   static async findByName(name) {
//     return db.query(
//       `SELECT * FROM products WHERE name ILIKE $1 AND active = true LIMIT 50`,
//       [`%${name}%`]
//     );
//   }
// }
// 


const db = require('../../config/database');
const Product = require('./ProductModel'); // Import du modèle Product

class ProductRepository {

  static async findAll(whereClause, params) {
    const query = `
      SELECT 
        p.*, 
        c.name as category_name,
        ( p.threshold) as low_stock,
        ROUND(((p.selling_price - p.purchase_price) / NULLIF(p.purchase_price, 0) * 100), 2) as margin_percentage
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.name
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
    const result = await db.query(query, params);
    // Convertir chaque ligne en objet Product
    return result.rows.map(row => new Product(row));
  }

  static async findById(id) {
    const result = await db.query(
      `SELECT 
        p.*, 
        c.name as category_name,
        ( p.threshold) as low_stock,
        ROUND(((p.selling_price - p.purchase_price) / NULLIF(p.purchase_price, 0) * 100), 2) as margin_percentage
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1 AND p.active = true`,
      [id]
    );
    return result.rows.length ? new Product(result.rows[0]) : null;
  }

  static async findByBarcode(barcode) {
    const result = await db.query(
      `SELECT * FROM products WHERE barcode = $1 AND active = true`,
      [barcode]
    );
    return result.rows.length ? new Product(result.rows[0]) : null;
  }

  static async create(client, name, barcode, selling_price, purchase_price, threshold, category_id, description, photo) {
    const query = `
      INSERT INTO products (
        name, barcode, selling_price, purchase_price, 
         threshold, category_id, description, photo, active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8,  true)
      RETURNING id, name, barcode, selling_price, purchase_price, 
                 threshold, category_id, description, photo, 
                active, created_at
    `;
    const result = await client.query(query, [name, barcode, selling_price, purchase_price,  threshold, category_id, description, photo]);
    return new Product(result.rows[0]);
  }

  static async update(client, id, name, barcode, selling_price, purchase_price,  threshold, category_id, description, photo) {
    const query = `
      UPDATE products
      SET name = $1, 
          barcode = $2, 
          selling_price = $3, 
          purchase_price = $4, 
          threshold = $5,
          category_id = $6, 
          description = $7,
          photo = $8,
          updated_at = NOW()
      WHERE id = $9
      RETURNING id, name, barcode, selling_price, purchase_price, 
                 threshold, category_id, description, photo, 
                updated_at, created_at
    `;
    const result = await client.query(query, [name, barcode, selling_price, purchase_price,  threshold, category_id, description, photo, id]);
    return new Product(result.rows[0]);
  }

  static async softDelete(client, id) {
    return client.query(
      `UPDATE products SET active = false WHERE id = $1 RETURNING id`,
      [id]
    );
  }

  // Méthode pour la recherche avancée
  static async search(filters) {
    let query = `
      SELECT 
        p.*, 
        c.name as category_name,
        (p.threshold) as low_stock,
        ROUND(((p.selling_price - p.purchase_price) / NULLIF(p.purchase_price, 0) * 100), 2) as margin_percentage
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.active = true
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (filters.search) {
      query += ` AND (p.name ILIKE $${paramIndex} OR p.barcode ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }
    
    if (filters.category_id) {
      query += ` AND p.category_id = $${paramIndex}`;
      params.push(filters.category_id);
      paramIndex++;
    }
    
    if (filters.site_id) {
      query += ` AND c.site_id = $${paramIndex}`;
      params.push(filters.site_id);
      paramIndex++;
    }
    
    if (filters.minMargin) {
      query += ` AND ((p.selling_price - p.purchase_price) / NULLIF(p.purchase_price, 0) * 100) >= $${paramIndex}`;
      params.push(parseFloat(filters.minMargin));
      paramIndex++;
    }
    
    if (filters.maxMargin) {
      query += ` AND ((p.selling_price - p.purchase_price) / NULLIF(p.purchase_price, 0) * 100) <= $${paramIndex}`;
      params.push(parseFloat(filters.maxMargin));
      paramIndex++;
    }
    
    if (filters.minSellingPrice) {
      query += ` AND p.selling_price >= $${paramIndex}`;
      params.push(parseFloat(filters.minSellingPrice));
      paramIndex++;
    }
    
    if (filters.maxSellingPrice) {
      query += ` AND p.selling_price <= $${paramIndex}`;
      params.push(parseFloat(filters.maxSellingPrice));
      paramIndex++;
    }
    
    if (filters.minPurchasePrice) {
      query += ` AND p.purchase_price >= $${paramIndex}`;
      params.push(parseFloat(filters.minPurchasePrice));
      paramIndex++;
    }
    
    if (filters.maxPurchasePrice) {
      query += ` AND p.purchase_price <= $${paramIndex}`;
      params.push(parseFloat(filters.maxPurchasePrice));
      paramIndex++;
    }
    
    if (filters.hasPhoto === 'true') {
      query += ` AND p.photo IS NOT NULL AND p.photo != ''`;
    }
    
    if (filters.noPhoto === 'true') {
      query += ` AND (p.photo IS NULL OR p.photo = '')`;
    }
    
    if (filters.lowStock === 'true') {
      query += ` AND  p.threshold`;
    }
    
    // if (filters.minQuantity) {
    //   query += ` AND p.quantity >= $${paramIndex}`;
    //   params.push(parseInt(filters.minQuantity));
    //   paramIndex++;
    // }
    
    
    
    // Tri multi-colonnes
    if (filters.sort) {
      const sortFields = filters.sort.split(',').map(field => {
        const [fieldName, order = 'asc'] = field.split(':');
        const allowedFields = ['name', 'selling_price', 'purchase_price',  'threshold', 'created_at', 'barcode', 'category_name', 'margin_percentage'];
        if (allowedFields.includes(fieldName)) {
          let columnName = fieldName;
          if (fieldName === 'category_name') columnName = 'c.name';
          if (fieldName === 'selling_price') columnName = 'p.selling_price';
          if (fieldName === 'purchase_price') columnName = 'p.purchase_price';
          if (fieldName === 'threshold') columnName = 'p.threshold';
          if (fieldName === 'name') columnName = 'p.name';
          if (fieldName === 'barcode') columnName = 'p.barcode';
          if (fieldName === 'created_at') columnName = 'p.created_at';
          if (fieldName === 'margin_percentage') columnName = 'margin_percentage';
          return `${columnName} ${order.toUpperCase()}`;
        }
        return null;
      }).filter(f => f !== null);
      
      if (sortFields.length > 0) {
        query += ` ORDER BY ${sortFields.join(', ')}`;
      } else {
        query += ` ORDER BY p.name ASC`;
      }
    } else {
      query += ` ORDER BY p.name ASC`;
    }
    
    // Pagination
    const page = parseInt(filters.page || 1);
    const limit = parseInt(filters.limit || 20);
    const offset = (page - 1) * limit;
    
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    return {
      rows: result.rows.map(row => new Product(row)),
      total: result.rows.length
    };
  }

  static async countSearch(filters) {
    let query = `
      SELECT COUNT(*) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.active = true
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (filters.search) {
      query += ` AND (p.name ILIKE $${paramIndex} OR p.barcode ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }
    
    if (filters.category_id) {
      query += ` AND p.category_id = $${paramIndex}`;
      params.push(filters.category_id);
      paramIndex++;
    }
    
    if (filters.site_id) {
      query += ` AND c.site_id = $${paramIndex}`;
      params.push(filters.site_id);
      paramIndex++;
    }
    
    const result = await db.query(query, params);
    return parseInt(result.rows[0].total);
  }

  // ✅ Méthode COUNT 
  static async count(whereClause, params) {
    const query = `SELECT COUNT(*) FROM products p ${whereClause}`;
    const result = await db.query(query, params);
    return result;
  }
}

module.exports = ProductRepository;