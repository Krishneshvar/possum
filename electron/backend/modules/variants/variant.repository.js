/**
 * Variant Repository
 * Handles all database operations for variants
 */
import { getDB } from '../../shared/db/index.js';

/**
 * Insert a new variant
 * @param {number} productId - Parent product ID
 * @param {Object} variant - Variant data
 * @returns {Object} Insert result
 */
export function insertVariant(productId, variant) {
  const db = getDB();
  const stmt = db.prepare(`
    INSERT INTO variants (
      product_id, name, sku, mrp, cost_price, stock, stock_alert_cap, is_default, status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    productId,
    variant.name,
    variant.sku,
    variant.mrp,
    variant.cost_price,
    variant.stock,
    variant.stock_alert_cap,
    variant.is_default ? 1 : 0,
    variant.status
  );
}

/**
 * Find all variants for a product
 * @param {number} productId - Product ID
 * @returns {Array} Variants list
 */
export function findVariantsByProductId(productId) {
  const db = getDB();
  return db.prepare('SELECT * FROM variants WHERE product_id = ? AND deleted_at IS NULL').all(productId);
}

/**
 * Update a variant
 * @param {Object} variant - Variant data with id
 * @returns {Object} Update result
 */
export function updateVariantById(variant) {
  const db = getDB();
  const stmt = db.prepare(`
    UPDATE variants
    SET name = ?, sku = ?, mrp = ?, cost_price = ?, stock = ?, stock_alert_cap = ?, status = ?, is_default = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND deleted_at IS NULL
  `);
  return stmt.run(
    variant.name,
    variant.sku,
    variant.mrp,
    variant.cost_price,
    variant.stock,
    variant.stock_alert_cap,
    variant.status,
    variant.is_default,
    variant.id
  );
}

/**
 * Soft delete a variant
 * @param {number} id - Variant ID
 * @returns {Object} Delete result
 */
export function softDeleteVariant(id) {
  const db = getDB();
  const stmt = db.prepare('UPDATE variants SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?');
  return stmt.run(id);
}

/**
 * Search variants with product info
 * @param {Object} params - Search params
 * @returns {Array} Matching variants
 */
export function searchVariants({ query }) {
  const db = getDB();
  const filterClauses = [];
  const filterParams = [];

  filterClauses.push(`v.deleted_at IS NULL`);
  filterClauses.push(`p.deleted_at IS NULL`);

  if (query) {
    filterClauses.push(`(p.name LIKE ? OR v.name LIKE ? OR v.sku LIKE ?)`);
    filterParams.push(`%${query}%`, `%${query}%`, `%${query}%`);
  }

  const whereClause = `WHERE ${filterClauses.join(' AND ')}`;

  const sql = `
    SELECT 
      v.*, p.name as product_name, p.image_path
    FROM variants v
    JOIN products p ON v.product_id = p.id
    ${whereClause}
    ORDER BY p.name ASC, v.name ASC
    LIMIT 50
  `;

  return db.prepare(sql).all(...filterParams);
}
