/**
 * Product Repository
 * Handles all database operations for products
 */
import { getDB } from '../../shared/db/index.js';

/**
 * Insert a new product into the database
 * @param {Object} productData - Product data
 * @returns {Object} The insert result with lastInsertRowid
 */
export function insertProduct({ name, description, category_id, status, product_tax, image_path }) {
    const db = getDB();
    const stmt = db.prepare(`
    INSERT INTO products (name, description, category_id, status, product_tax, image_path)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
    return stmt.run(name, description, category_id, status, product_tax, image_path);
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
      p.id, p.name, p.description, p.status, p.image_path, p.product_tax, 
      c.name AS category_name, p.category_id
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
export function updateProductById(productId, { name, description, category_id, status, product_tax, image_path }) {
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
 * Find products with filtering and pagination
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
}
