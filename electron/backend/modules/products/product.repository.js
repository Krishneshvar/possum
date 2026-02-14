/**
 * Product Repository
 * Handles all database operations for products
 * Note: Stock is NEVER stored directly - it is derived from inventory_lots + inventory_adjustments
 */
import { getDB } from '../../shared/db/index.js';

/**
 * Insert a new product into the database
 * @param {Object} productData - Product data
 * @returns {Object} The insert result with lastInsertRowid
 */
export function insertProduct({ name, description, category_id, tax_category_id, status, image_path }) {
    const db = getDB();
    const stmt = db.prepare(`
    INSERT INTO products (name, description, category_id, tax_category_id, status, image_path)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
    return stmt.run(name, description, category_id, tax_category_id, status ?? 'active', image_path);
}

/**
 * Find a product by ID with category info
 * @param {number} id - Product ID
 * @returns {Object|null} Product or null
 */
export function findProductById(id) {
    const db = getDB();
    return db.prepare(`
    SELECT
      p.id, p.name, p.description, p.status, p.image_path,
      c.name AS category_name, p.category_id, p.tax_category_id
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ? AND p.deleted_at IS NULL
  `).get(id);
}

/**
 * Get the image path for a product
 * @param {number} id - Product ID
 * @returns {Object|null} Object with image_path or null
 */
export function findProductImagePath(id) {
    const db = getDB();
    return db.prepare('SELECT image_path FROM products WHERE id = ?').get(id);
}

/**
 * Update a product
 * @param {number} productId - Product ID
 * @param {Object} data - Fields to update
 * @returns {Object} The update result with changes count
 */
export function updateProductById(productId, { name, description, category_id, tax_category_id, status, image_path }) {
    const db = getDB();
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
    if (tax_category_id !== undefined) {
        updateFields.push('tax_category_id = ?');
        params.push(tax_category_id);
    }
    if (status !== undefined) {
        updateFields.push('status = ?');
        params.push(status);
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
}

/**
 * Soft delete a product
 * @param {number} id - Product ID
 * @returns {Object} The delete result with changes count
 */
export function softDeleteProduct(id) {
    const db = getDB();
    const stmt = db.prepare('UPDATE products SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?');
    return stmt.run(id);
}

/**
 * Helper to build stock subquery for derived stock calculation
 * @returns {string} SQL subquery for stock calculation
 */
function getStockSubquery() {
    return `(
        COALESCE((SELECT SUM(il.quantity) FROM inventory_lots il WHERE il.variant_id = v.id), 0)
        + COALESCE((SELECT SUM(ia.quantity_change) FROM inventory_adjustments ia WHERE ia.variant_id = v.id AND ia.reason != 'confirm_receive'), 0)
    )`;
}

/**
 * Find products with filtering and pagination
 * Stock is derived from inventory_lots + inventory_adjustments
 * @param {Object} params - Filter and pagination params
 * @returns {Object} Products list with pagination info
 */
export function findProducts({ searchTerm, stockStatus, status, categories, currentPage, itemsPerPage }) {
    const db = getDB();
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

    // Build stock status conditions using derived stock
    const stockSubquery = getStockSubquery();
    if (stockStatus && stockStatus.length > 0) {
        const stockConditions = [];
        stockStatus.forEach(s => {
            if (s === 'out-of-stock') {
                stockConditions.push(`${stockSubquery} = 0`);
            } else if (s === 'low-stock') {
                stockConditions.push(`${stockSubquery} > 0 AND ${stockSubquery} <= COALESCE(v.stock_alert_cap, 10)`);
            } else if (s === 'in-stock') {
                stockConditions.push(`${stockSubquery} > COALESCE(v.stock_alert_cap, 10)`);
            }
        });
        if (stockConditions.length > 0) {
            filterClauses.push(`(${stockConditions.join(' OR ')})`);
        }
    }

    const whereClause = `WHERE ${filterClauses.join(' AND ')}`;

    const countQuery = `
    SELECT
      COUNT(DISTINCT p.id) as total_count
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    INNER JOIN variants v ON p.id = v.product_id AND v.is_default = 1 AND v.deleted_at IS NULL
    ${whereClause}
  `;
    const countResult = db.prepare(countQuery).get(...filterParams);
    const totalCount = countResult?.total_count ?? 0;

    const paginatedQuery = `
    SELECT
      p.id,
      p.name,
      p.status,
      p.image_path,
      c.name AS category_name,
      p.tax_category_id,
      ${stockSubquery} AS stock,
      v.stock_alert_cap
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    INNER JOIN variants v ON p.id = v.product_id AND v.is_default = 1 AND v.deleted_at IS NULL
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
}

/**
 * Get product with variants and their computed stock
 * @param {number} productId - Product ID
 * @returns {Object|null} Product with variants including stock
 */
export function findProductWithVariants(productId) {
    const db = getDB();

    const product = findProductById(productId);
    if (!product) {
        return null;
    }

    const stockSubquery = getStockSubquery();
    const variants = db.prepare(`
        SELECT 
            v.*,
            ${stockSubquery} AS stock
        FROM variants v
        WHERE v.product_id = ? AND v.deleted_at IS NULL
        ORDER BY v.is_default DESC, v.name ASC
    `).all(productId);

    return {
        ...product,
        variants
    };
}

/**
 * Get tax information for a product
 * @param {number} productId - Product ID
 * @returns {Array} Array of applicable taxes
 */
export function findProductTaxes(productId) {
    const db = getDB();
    return db.prepare(`
        SELECT t.id, t.name, t.rate, t.type
        FROM taxes t
        INNER JOIN product_taxes pt ON t.id = pt.tax_id
        WHERE pt.product_id = ? AND t.is_active = 1
    `).all(productId);
}

/**
 * Set taxes for a product
 * @param {number} productId - Product ID
 * @param {number[]} taxIds - Array of tax IDs
 */
export function setProductTaxes(productId, taxIds) {
    const db = getDB();

    // Remove existing tax associations
    db.prepare('DELETE FROM product_taxes WHERE product_id = ?').run(productId);

    // Insert new associations
    if (taxIds && taxIds.length > 0) {
        const insertStmt = db.prepare('INSERT INTO product_taxes (product_id, tax_id) VALUES (?, ?)');
        for (const taxId of taxIds) {
            insertStmt.run(productId, taxId);
        }
    }
}
