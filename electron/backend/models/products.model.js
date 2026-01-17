import { initDB } from '../db.js';
import path from 'path';
import fs from 'fs';
import { __dirname } from '../server.js';

const db = initDB();

const addProductWithVariants = ({ name, description, category_id, status, product_tax, image_path, variants }) => {
  const transaction = db.transaction(() => {
    const productInfo = db.prepare(`
      INSERT INTO products (name, description, category_id, status, product_tax, image_path)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, description, category_id, status, product_tax, image_path);

    const newProductId = productInfo.lastInsertRowid;

    const insertVariant = db.prepare(`
      INSERT INTO variants (
        product_id, name, sku, price, cost_price, stock, stock_alert_cap, is_default, status
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
        variant.is_default ? 1 : 0,
        variant.status
      );
    }

    return { id: newProductId };
  });

  return transaction();
};

const getProductWithAllVariants = (id) => {
  const product = db.prepare(`
    SELECT
      p.id, p.name, p.description, p.status, p.image_path, p.product_tax, c.name AS category_name, p.category_id
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ? AND p.deleted_at IS NULL
  `).get(id);

  if (!product) return null;

  const variants = db.prepare('SELECT * FROM variants WHERE product_id = ? AND deleted_at IS NULL').all(id);
  return { ...product, variants };
}

const updateProduct = (productId, { name, description, category_id, status, product_tax, image_path }) => {
  let updateFields = ['updated_at = CURRENT_TIMESTAMP'];
  let params = [];

  if (name !== undefined) {
    updateFields.push('name = ?');
    params.push(name);
  }
  if (description !== undefined) {
    updateFields.push('description = ?');
    params.push(description);
  }
  if (category_id !== undefined) {
    updateFields.push('category_id = ?');
    params.push(category_id);
  }
  if (status !== undefined) {
    updateFields.push('status = ?');
    params.push(status);
  }
  if (product_tax !== undefined) {
    updateFields.push('product_tax = ?');
    params.push(product_tax);
  }
  if (image_path !== undefined) {
    updateFields.push('image_path = ?');
    params.push(image_path);
  }

  if (updateFields.length === 1) {
    return { changes: 0 };
  }

  const stmt = db.prepare(`
    UPDATE products
    SET ${updateFields.join(', ')}
    WHERE id = ?
  `);

  params.push(productId);
  return stmt.run(...params);
};

const updateVariant = (variant) => {
  const stmt = db.prepare(`
    UPDATE variants
    SET name = ?, sku = ?, price = ?, cost_price = ?, stock = ?, stock_alert_cap = ?, status = ?, is_default = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND deleted_at IS NULL
  `);
  return stmt.run(
    variant.name,
    variant.sku,
    variant.price,
    variant.cost_price,
    variant.stock,
    variant.stock_alert_cap,
    variant.status,
    variant.is_default,
    variant.id
  );
};

const addVariant = (productId, variant) => {
  const stmt = db.prepare(`
    INSERT INTO variants (
      product_id, name, sku, price, cost_price, stock, stock_alert_cap, is_default, status
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
    variant.is_default ? 1 : 0,
    variant.status
  );
};

const deleteVariant = (id) => {
  const stmt = db.prepare('UPDATE variants SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?');
  return stmt.run(id);
};

const deleteProduct = (id) => {
  const product = db.prepare('SELECT image_path FROM products WHERE id = ?').get(id);
  if (product && product.image_path) {
    const filePath = path.join(__dirname, '..', product.image_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  const stmt = db.prepare('UPDATE products SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?');
  return stmt.run(id);
}

const getProducts = ({ searchTerm, stockStatus, status, categories, currentPage, itemsPerPage }) => {
  const filterClauses = [];
  const filterParams = [];

  filterClauses.push(`p.deleted_at IS NULL`);

  if (searchTerm) {
    filterClauses.push(`(p.name LIKE ?)`);
    filterParams.push(`%${searchTerm}%`);
  }

  if (categories && categories.length > 0) {
    const placeholders = categories.map(() => '?').join(',');
    filterClauses.push(`p.category_id IN (${placeholders})`);
    filterParams.push(...categories);
  }

  if (status && status.length > 0) {
    const placeholders = status.map(() => '?').join(',');
    filterClauses.push(`p.status IN (${placeholders})`);
    filterParams.push(...status);
  }

  if (stockStatus && stockStatus.length > 0) {
    const stockConditions = [];
    stockStatus.forEach(s => {
      if (s === 'out-of-stock') {
        stockConditions.push(`v.stock = 0`);
      } else if (s === 'low-stock') {
        stockConditions.push(`v.stock > 0 AND v.stock <= COALESCE(v.stock_alert_cap, 0)`);
      } else if (s === 'in-stock') {
        stockConditions.push(`v.stock > COALESCE(v.stock_alert_cap, 0)`);
      }
    });
    if (stockConditions.length > 0) {
      filterClauses.push(`(${stockConditions.join(' OR ')})`);
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
      p.image_path,
      c.name AS category_name,
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
  updateProduct,
  updateVariant,
  addVariant,
  deleteVariant,
  deleteProduct,
  getProducts
};
