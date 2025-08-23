import { initDB } from '../db.js';

const db = initDB();

const addProductWithVariants = ({ name, category_id, status, variants }) => {
  const transaction = db.transaction(() => {
    const productInfo = db.prepare(`
      INSERT INTO products (name, category_id, status)
      VALUES (?, ?, ?)
    `).run(name, category_id, status);
    
    const newProductId = productInfo.lastInsertRowid;

    const insertVariant = db.prepare(`
      INSERT INTO variants (
        product_id, name, sku, price, cost_price, stock, stock_alert_cap, product_tax, is_default
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const variant of variants) {
      insertVariant.run(
        newProductId,
        variant.name,
        variant.sku,
        variant.price,
        variant.cost_price,
        variant.stock,
        variant.stock_alert_cap,
        variant.product_tax,
        variant.is_default ? 1 : 0
      );
    }

    return { id: newProductId };
  });

  return transaction();
};

const getProductWithAllVariants = (id) => {
  const product = db.prepare(`
    SELECT
      p.id, p.name, p.status, c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ? AND p.deleted_at IS NULL
  `).get(id);

  if (!product) return null;

  const variants = db.prepare('SELECT * FROM variants WHERE product_id = ? AND deleted_at IS NULL').all(id);
  return { ...product, variants };
}

const updateProduct = (productId, { name, category_id, status }) => {
  const stmt = db.prepare(`
    UPDATE products
    SET name = ?, category_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  return stmt.run(name, category_id, status, productId);
};

const updateVariant = (variant) => {
  const stmt = db.prepare(`
    UPDATE variants
    SET name = ?, sku = ?, price = ?, cost_price = ?, stock = ?, stock_alert_cap = ?, product_tax = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  return stmt.run(
    variant.name,
    variant.sku,
    variant.price,
    variant.cost_price,
    variant.stock,
    variant.stock_alert_cap,
    variant.product_tax,
    variant.id // Use the variant ID for the WHERE clause
  );
};

const addVariant = (productId, variant) => {
  const stmt = db.prepare(`
    INSERT INTO variants (
      product_id, name, sku, price, cost_price, stock, stock_alert_cap, product_tax, is_default
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    productId,
    variant.name,
    variant.sku,
    variant.price,
    variant.cost_price,
    variant.stock,
    variant.stock_alert_cap,
    variant.product_tax,
    variant.is_default ? 1 : 0
  );
};

const updateProductWithVariants = (productId, { name, category_id, status, variants }) => {
  const transaction = db.transaction(() => {
    // 1. Update the main product details
    const productChanges = updateProduct(productId, { name, category_id, status });

    // 2. Get the IDs of the variants currently in the DB for this product
    const existingVariants = db.prepare('SELECT id FROM variants WHERE product_id = ?').all(productId);
    const existingVariantIds = existingVariants.map(v => v.id);

    // 3. Get the IDs of the variants sent from the frontend
    const submittedVariantIds = variants.filter(v => v._tempId && typeof v._tempId === 'number').map(v => v._tempId);

    // 4. Find variants to be deleted (present in DB, but not in submitted data)
    const variantsToDelete = existingVariantIds.filter(id => !submittedVariantIds.includes(id));
    if (variantsToDelete.length > 0) {
      const placeholders = variantsToDelete.map(() => '?').join(',');
      db.prepare(`UPDATE variants SET deleted_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`).run(...variantsToDelete);
    }

    // 5. Loop through submitted variants to update or add
    for (const variant of variants) {
      if (variant._tempId && typeof variant._tempId === 'number') {
        // Variant has an ID, so it's an update
        updateVariant({ ...variant, id: variant._tempId });
      } else {
        // Variant has a temporary ID (_tempId), so it's a new variant
        addVariant(productId, variant);
      }
    }

    return { productChanges };
  });

  return transaction();
};

// Deletes a product and all its variants via cascading delete
const deleteProduct = (id) => {
  const stmt = db.prepare('UPDATE products SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?');
  return stmt.run(id);
}

// Retrieves products with filtering, searching, and pagination
const getProducts = ({ searchTerm, stockStatus, status, categories, currentPage, itemsPerPage }) => {
  let query = `
    SELECT
      p.id,
      p.name,
      p.status,
      c.name AS category_name,
      v.sku,
      v.price,
      v.stock,
      v.stock_alert_cap
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    INNER JOIN variants v ON p.id = v.product_id AND v.is_default = 1
    WHERE p.deleted_at IS NULL
  `;
  const params = [];

  // Filter conditions
  if (searchTerm) {
    query += ` AND (p.name LIKE ? OR v.sku LIKE ?)`;
    params.push(`%${searchTerm}%`, `%${searchTerm}%`);
  }

  if (categories && categories.length > 0) {
    const placeholders = categories.map(() => '?').join(',');
    query += ` AND p.category_id IN (${placeholders})`;
    params.push(...categories);
  }

  if (status && status !== 'all') {
    query += ` AND p.status = ?`;
    params.push(status);
  }

  // Count the total number of products before applying pagination
  const countQuery = `SELECT COUNT(*) FROM (${query}) AS filtered_products`;
  const totalCount = db.prepare(countQuery).get(...params)['COUNT(*)'];

  // Apply stock status filter
  const getStockStatus = (stock, stockAlertCap) => {
    if (stock === 0) return 'out-of-stock';
    if (stock <= stockAlertCap) return 'low-stock';
    return 'in-stock';
  };
  
  // The stock status filter is applied in-memory after fetching from the DB
  const allProducts = db.prepare(query + ` ORDER BY p.name ASC`).all(...params);
  const filteredProducts = stockStatus === 'all'
    ? allProducts
    : allProducts.filter(p => getStockStatus(p.stock, p.stock_alert_cap) === stockStatus);

  // Apply pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  return {
    products: paginatedProducts,
    totalCount: filteredProducts.length,
    totalPages
  };
};

export {
  addProductWithVariants,
  getProductWithAllVariants,
  updateProductWithVariants,
  deleteProduct,
  getProducts
};
