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
export function findVariants({ searchTerm, categoryId, stockStatus, sortBy = 'p.name', sortOrder = 'ASC', currentPage = 1, itemsPerPage = 10 }) {
  const db = getDB();
  const filterClauses = [];
  const filterParams = [];

  filterClauses.push(`v.deleted_at IS NULL`);
  filterClauses.push(`p.deleted_at IS NULL`);

  if (searchTerm) {
    filterClauses.push(`(p.name LIKE ? OR v.name LIKE ? OR v.sku LIKE ?)`);
    filterParams.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
  }

  if (categoryId) {
    filterClauses.push(`p.category_id = ?`);
    filterParams.push(categoryId);
  }

  const whereClause = `WHERE ${filterClauses.join(' AND ')}`;

  // For stockStatus filtering, we need to apply it after computing stock or use a HAVING/subquery
  // Given the structure, using a subquery for the count and main query is better

  let stockFilterClause = '';
  if (stockStatus === 'low') {
    stockFilterClause = 'WHERE current_stock <= stock_alert_cap AND current_stock > 0';
  } else if (stockStatus === 'out') {
    stockFilterClause = 'WHERE current_stock = 0';
  } else if (stockStatus === 'ok') {
    stockFilterClause = 'WHERE current_stock > stock_alert_cap';
  }

  const countSql = `
    SELECT COUNT(*) as total FROM (
      SELECT 
        v.id,
        (
            COALESCE((SELECT SUM(quantity) FROM inventory_lots WHERE variant_id = v.id), 0)
            + COALESCE((SELECT SUM(quantity_change) FROM inventory_adjustments WHERE variant_id = v.id AND (reason != 'confirm_receive' OR lot_id IS NULL)), 0)
        ) AS current_stock,
        v.stock_alert_cap
      FROM variants v
      JOIN products p ON v.product_id = p.id
      ${whereClause}
    ) ${stockFilterClause}
  `;
  const totalCount = db.prepare(countSql).get(...filterParams).total;

  // Validate sort parameters to prevent SQL injection and handle outer query aliases
  const allowSortColumns = ['p.name', 'v.name', 'v.sku', 'v.mrp', 'v.cost_price', 'v.status', 'v.created_at', 'stock'];
  const sortMap = {
    'p.name': 'product_name',
    'v.name': 'name',
    'v.sku': 'sku',
    'v.mrp': 'mrp',
    'v.cost_price': 'cost_price',
    'v.status': 'status',
    'v.created_at': 'created_at',
    'stock': 'stock'
  };

  const safeSortBy = sortMap[sortBy] || 'product_name';
  const safeSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  const startIndex = (currentPage - 1) * itemsPerPage;
  const sql = `
    SELECT * FROM (
      SELECT 
        v.id, v.product_id, v.name, v.sku, v.mrp, v.cost_price, 
        v.stock_alert_cap, v.is_default, v.status, v.created_at,
        p.name as product_name, p.image_path,
        c.name as category_name,
        (
            COALESCE((SELECT SUM(quantity) FROM inventory_lots WHERE variant_id = v.id), 0)
            + COALESCE((SELECT SUM(quantity_change) FROM inventory_adjustments WHERE variant_id = v.id AND (reason != 'confirm_receive' OR lot_id IS NULL)), 0)
        ) AS stock,
        (
          SELECT json_group_array(json_object('id', t.id, 'name', t.name, 'rate', t.rate, 'type', t.type))
          FROM product_taxes pt
          JOIN taxes t ON pt.tax_id = t.id
          WHERE pt.product_id = v.product_id AND t.is_active = 1
        ) AS taxes
      FROM variants v
      JOIN products p ON v.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
    ) ${stockFilterClause === '' ? '' : stockFilterClause.replace(/current_stock/g, 'stock')}
    ORDER BY ${safeSortBy === 'stock' ? 'stock' : safeSortBy} ${safeSortOrder}
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

  return {
    variants,
    totalCount,
    totalPages: Math.ceil(totalCount / itemsPerPage)
  };
}
