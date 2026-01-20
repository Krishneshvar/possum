/**
 * Variant Repository
 * Handles all database operations for variants
 * Note: Stock is NEVER stored directly - it is derived from inventory_lots + inventory_adjustments
 */
import { getDB } from '../../shared/db/index.js';
import { getComputedStock, getComputedStockBatch } from '../../shared/utils/inventoryHelpers.js';

/**
 * Insert a new variant (without stock - stock comes from inventory operations)
 * @param {number} productId - Parent product ID
 * @param {Object} variant - Variant data
 * @returns {Object} Insert result
 */
export function insertVariant(productId, variant) {
  const db = getDB();
  const stmt = db.prepare(`
    INSERT INTO variants (
      product_id, name, sku, mrp, cost_price, stock_alert_cap, is_default, status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    productId,
    variant.name,
    variant.sku,
    variant.mrp,
    variant.cost_price,
    variant.stock_alert_cap ?? 10,
    variant.is_default ? 1 : 0,
    variant.status ?? 'active'
  );
}

/**
 * Find all variants for a product with computed stock
 * @param {number} productId - Product ID
 * @returns {Array} Variants list with stock
 */
export function findVariantsByProductId(productId) {
  const db = getDB();
  const variants = db.prepare('SELECT * FROM variants WHERE product_id = ? AND deleted_at IS NULL').all(productId);

  if (variants.length === 0) {
    return [];
  }

  const variantIds = variants.map(v => v.id);
  const stockMap = getComputedStockBatch(variantIds);

  return variants.map(variant => ({
    ...variant,
    stock: stockMap[variant.id] ?? 0
  }));
}

/**
 * Find a single variant by ID with computed stock
 * @param {number} id - Variant ID
 * @returns {Object|null} Variant with stock or null
 */
export function findVariantById(id) {
  const db = getDB();
  const variant = db.prepare('SELECT * FROM variants WHERE id = ? AND deleted_at IS NULL').get(id);

  if (!variant) {
    return null;
  }

  return {
    ...variant,
    stock: getComputedStock(id)
  };
}

/**
 * Update a variant (without stock - stock is derived)
 * @param {Object} variant - Variant data with id
 * @returns {Object} Update result
 */
export function updateVariantById(variant) {
  const db = getDB();
  const stmt = db.prepare(`
    UPDATE variants
    SET name = ?, sku = ?, mrp = ?, cost_price = ?, stock_alert_cap = ?, status = ?, is_default = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND deleted_at IS NULL
  `);
  return stmt.run(
    variant.name,
    variant.sku,
    variant.mrp,
    variant.cost_price,
    variant.stock_alert_cap ?? 10,
    variant.status,
    variant.is_default ? 1 : 0,
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
 * Find variants with filtering, pagination, and sorting
 * @param {Object} params - Query parameters
 * @returns {Object} Paginated variants data
 */
export function findVariants({ searchTerm, sortBy = 'p.name', sortOrder = 'ASC', currentPage = 1, itemsPerPage = 10 }) {
  const db = getDB();
  const filterClauses = [];
  const filterParams = [];

  filterClauses.push(`v.deleted_at IS NULL`);
  filterClauses.push(`p.deleted_at IS NULL`);

  if (searchTerm) {
    filterClauses.push(`(p.name LIKE ? OR v.name LIKE ? OR v.sku LIKE ?)`);
    filterParams.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
  }

  const whereClause = `WHERE ${filterClauses.join(' AND ')}`;

  // Get total count
  const countSql = `
    SELECT COUNT(*) as total
    FROM variants v
    JOIN products p ON v.product_id = p.id
    ${whereClause}
  `;
  const totalCount = db.prepare(countSql).get(...filterParams).total;

  // Validate sort parameters to prevent SQL injection
  const allowSortColumns = ['p.name', 'v.name', 'v.sku', 'v.mrp', 'v.cost_price', 'v.status', 'v.created_at'];
  const safeSortBy = allowSortColumns.includes(sortBy) ? sortBy : 'p.name';
  const safeSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  const startIndex = (currentPage - 1) * itemsPerPage;
  const sql = `
    SELECT 
      v.id, v.product_id, v.name, v.sku, v.mrp, v.cost_price, 
      v.stock_alert_cap, v.is_default, v.status, v.created_at,
      p.name as product_name, p.image_path,
      c.name as category_name
    FROM variants v
    JOIN products p ON v.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    ${whereClause}
    ORDER BY ${safeSortBy} ${safeSortOrder}
    LIMIT ? OFFSET ?
  `;

  const variants = db.prepare(sql).all(...filterParams, itemsPerPage, startIndex);

  if (variants.length === 0) {
    return {
      variants: [],
      totalCount: 0,
      totalPages: 0
    };
  }

  const variantIds = variants.map(v => v.id);
  const stockMap = getComputedStockBatch(variantIds);

  const paginatedVariants = variants.map(variant => ({
    ...variant,
    stock: stockMap[variant.id] ?? 0
  }));

  return {
    variants: paginatedVariants,
    totalCount,
    totalPages: Math.ceil(totalCount / itemsPerPage)
  };
}
