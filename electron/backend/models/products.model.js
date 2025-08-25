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
    variant.id
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
    const productChanges = updateProduct(productId, { name, category_id, status });

    const existingVariants = db.prepare('SELECT id FROM variants WHERE product_id = ?').all(productId);
    const existingVariantIds = existingVariants.map(v => v.id);

    const submittedVariantIds = variants.filter(v => v._tempId && typeof v._tempId === 'number').map(v => v._tempId);

    const variantsToDelete = existingVariantIds.filter(id => !submittedVariantIds.includes(id));
    if (variantsToDelete.length > 0) {
      const placeholders = variantsToDelete.map(() => '?').join(',');
      db.prepare(`UPDATE variants SET deleted_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`).run(...variantsToDelete);
    }

    for (const variant of variants) {
      if (variant._tempId && typeof variant._tempId === 'number') {
        updateVariant({ ...variant, id: variant._tempId });
      } else {
        addVariant(productId, variant);
      }
    }

    return { productChanges };
  });

  return transaction();
};

const deleteProduct = (id) => {
  const stmt = db.prepare('UPDATE products SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?');
  return stmt.run(id);
}

const getProducts = ({ searchTerm, stockStatus, status, categories, currentPage, itemsPerPage }) => {
  const filterClauses = [];
  const filterParams = [];

  filterClauses.push(`p.deleted_at IS NULL`);
  
  if (searchTerm) {
    filterClauses.push(`(p.name LIKE ? OR v.sku LIKE ?)`);
    filterParams.push(`%${searchTerm}%`, `%${searchTerm}%`);
  }

  if (categories && categories.length > 0) {
    const placeholders = categories.map(() => '?').join(',');
    filterClauses.push(`p.category_id IN (${placeholders})`);
    filterParams.push(...categories);
  }

  if (status && status !== 'all') {
    filterClauses.push(`p.status = ?`);
    filterParams.push(status);
  }

  if (stockStatus && stockStatus !== 'all') {
    if (stockStatus === 'out-of-stock') {
      filterClauses.push(`v.stock = 0`);
    } else if (stockStatus === 'low-stock') {
      filterClauses.push(`v.stock > 0 AND v.stock <= COALESCE(v.stock_alert_cap, 0)`);
    } else if (stockStatus === 'in-stock') {
      filterClauses.push(`v.stock > COALESCE(v.stock_alert_cap, 0)`);
    }
  }

  const whereClause = `WHERE ${filterClauses.join(' AND ')}`;

  const countQuery = `
    SELECT
      COUNT(DISTINCT p.id)
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    INNER JOIN variants v ON p.id = v.product_id AND v.is_default = 1
    ${whereClause}
  `;
  const totalCount = db.prepare(countQuery).get(...filterParams)['COUNT(DISTINCT p.id)'];

  const paginatedQuery = `
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
    ${whereClause}
    GROUP BY p.id
    ORDER BY p.name ASC
    LIMIT ? OFFSET ?
  `;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedParams = [...filterParams, itemsPerPage, startIndex];

  const paginatedProducts = db.prepare(paginatedQuery).all(...paginatedParams);
  
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return {
    products: paginatedProducts,
    totalCount: totalCount,
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
