/**
 * Product Repository
 * Handles all database operations for products
 * Note: Stock is NEVER stored directly - it is derived from inventory_lots + inventory_adjustments
 */
import { getDB } from '../../shared/db/index.js';
import { Product, Variant } from '../../../../types/index.js';
import { getComputedStockBatch } from '../../shared/utils/inventoryHelpers.js';

export interface ProductFilter {
    searchTerm?: string;
    stockStatus?: string[];
    status?: string[];
    categories?: number[];
    currentPage: number;
    itemsPerPage: number;
    sortBy?: string;
    sortOrder?: string;
}

export interface PaginatedProducts {
    products: Product[];
    totalCount: number;
    totalPages: number;
}

/**
 * Insert a new product into the database
 * @param {Object} productData - Product data
 * @returns {Object} The insert result with lastInsertRowid
 */
export function insertProduct({ name, description, category_id, tax_category_id, status, image_path }: Partial<Product>): { lastInsertRowid: number | bigint } {
    const db = getDB();
    const stmt = db.prepare(`
    INSERT INTO products (name, description, category_id, tax_category_id, status, image_path)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
    return stmt.run(name, description, category_id || null, tax_category_id || null, status ?? 'active', image_path || null);
}

/**
 * Find a product by ID with category info
 * @param {number} id - Product ID
 * @returns {Object|null} Product or null
 */
export function findProductById(id: number): Product | undefined {
    const db = getDB();
    return db.prepare(`
    SELECT
      p.id, p.name, p.description, p.status, p.image_path,
      c.name AS category_name, p.category_id, p.tax_category_id
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ? AND p.deleted_at IS NULL
  `).get(id) as Product | undefined;
}

/**
 * Get the image path for a product
 * @param {number} id - Product ID
 * @returns {Object|null} Object with image_path or null
 */
export function findProductImagePath(id: number): { image_path: string | null } | undefined {
    const db = getDB();
    return db.prepare('SELECT image_path FROM products WHERE id = ?').get(id) as { image_path: string | null } | undefined;
}

/**
 * Update a product
 * @param {number} productId - Product ID
 * @param {Object} data - Fields to update
 * @returns {Object} The update result with changes count
 */
export function updateProductById(productId: number, { name, description, category_id, tax_category_id, status, image_path }: Partial<Product>): { changes: number } {
    const db = getDB();
    let updateFields: string[] = ['updated_at = CURRENT_TIMESTAMP'];
    let params: any[] = [];

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
export function softDeleteProduct(id: number): { changes: number } {
    const db = getDB();
    const stmt = db.prepare('UPDATE products SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?');
    return stmt.run(id);
}

/**
 * Helper to build stock subquery for derived stock calculation
 * @returns {string} SQL subquery for stock calculation
 */
function getStockSubquery(): string {
    return `(
        COALESCE((SELECT SUM(il.quantity) FROM inventory_lots il WHERE il.variant_id = v.id), 0)
        + COALESCE((SELECT SUM(ia.quantity_change) FROM inventory_adjustments ia WHERE ia.variant_id = v.id AND ia.reason != 'confirm_receive'), 0)
    )`;
}

/**
 * Find products with filtering and pagination
 * Stock is derived from inventory_lots + inventory_adjustments
 * @param {Object} params - Filter and pagination params
 * @returns {Promise<PaginatedProducts>} Products list with pagination info
 */
export async function findProducts({ searchTerm, stockStatus, status, categories, currentPage, itemsPerPage, sortBy, sortOrder }: ProductFilter): Promise<PaginatedProducts> {
    const db = getDB();
    const filterClauses: string[] = [];
    const filterParams: any[] = [];

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
        const stockConditions: string[] = [];
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
    LEFT JOIN variants v ON v.id = (
      SELECT v2.id
      FROM variants v2
      WHERE v2.product_id = p.id AND v2.deleted_at IS NULL
      ORDER BY v2.is_default DESC, v2.id ASC
      LIMIT 1
    )
    ${whereClause}
  `;
    const countResult = db.prepare(countQuery).get(...filterParams) as { total_count: number } | undefined;
    const totalCount = countResult?.total_count ?? 0;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedParams = [...filterParams, itemsPerPage, startIndex];

    // Whitelist allowed sort columns to prevent SQL injection
    const allowedSortColumns: Record<string, string> = {
        name: 'p.name',
        category_name: 'c.name',
        stock: 'computed_stock',
    };
    const orderByColumn = allowedSortColumns[sortBy ?? 'name'] ?? 'p.name';
    const orderByDirection = sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Note: We always use the batch approach for stock calculation in the async path
    const paginatedQuery = `
    SELECT
      p.id,
      p.name,
      p.status,
      p.image_path,
      c.name AS category_name,
      p.tax_category_id,
      v.id as variant_id,
      v.stock_alert_cap,
      ${getStockSubquery()} AS computed_stock
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN variants v ON v.id = (
      SELECT v2.id
      FROM variants v2
      WHERE v2.product_id = p.id AND v2.deleted_at IS NULL
      ORDER BY v2.is_default DESC, v2.id ASC
      LIMIT 1
    )
    ${whereClause}
    GROUP BY p.id
    ORDER BY ${orderByColumn} ${orderByDirection}
    LIMIT ? OFFSET ?
  `;

    const products = db.prepare(paginatedQuery).all(...paginatedParams) as (Product & { variant_id?: number })[];

    // Compute stock in batch for the result page asynchronously
    const variantIds = products
        .map(p => p.variant_id)
        .filter((id): id is number => typeof id === 'number');
    const stockMap = await getComputedStockBatch(variantIds);

    const paginatedProducts = products.map(p => {
        const product = { ...p, stock: stockMap[p.variant_id!] ?? 0 };
        // Clean up internal fields
        delete (product as any).variant_id;
        delete (product as any).computed_stock;
        return product;
    });

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
 * @returns {Promise<Product|null>} Product with variants including stock
 */
export async function findProductWithVariants(productId: number): Promise<Product | null> {
    const db = getDB();

    const product = findProductById(productId);
    if (!product) {
        return null;
    }

    const variants = db.prepare(`
        SELECT 
            v.*,
            v.mrp as price
        FROM variants v
        WHERE v.product_id = ? AND v.deleted_at IS NULL
        ORDER BY v.is_default DESC, v.name ASC
    `).all(productId) as Variant[];

    // Compute stock in batch for variants asynchronously
    const variantIds = variants.map(v => v.id!);
    const stockMap = await getComputedStockBatch(variantIds);

    const variantsWithStock = variants.map(v => ({
        ...v,
        stock: stockMap[v.id!] ?? 0
    }));

    return {
        ...product,
        variants: variantsWithStock
    };
}

/**
 * Get tax information for a product
 * @param {number} productId - Product ID
 * @returns {Array} Array of applicable taxes
 */
export function findProductTaxes(productId: number): any[] {
    const db = getDB();
    const product = db.prepare('SELECT tax_category_id FROM products WHERE id = ?').get(productId) as { tax_category_id: number | null } | undefined;

    if (!product || !product.tax_category_id) {
        return [];
    }

    const activeProfile = db.prepare('SELECT id FROM tax_profiles WHERE is_active = 1').get() as { id: number } | undefined;
    if (!activeProfile) {
        return [];
    }

    return db.prepare(`
    SELECT
    tr.id,
        tc.name,
        tr.rate_percent as rate,
        tr.rule_scope as type
        FROM tax_rules tr
        INNER JOIN tax_categories tc ON tr.tax_category_id = tc.id
        WHERE tr.tax_profile_id = ?
        AND tr.tax_category_id = ?
            AND(tr.valid_from IS NULL OR tr.valid_from <= date('now'))
        AND(tr.valid_to IS NULL OR tr.valid_to >= date('now'))
        ORDER BY tr.priority DESC
        `).all(activeProfile.id, product.tax_category_id);
}

/**
 * Set taxes for a product (deprecated - now uses tax_category_id)
 * @param {number} productId - Product ID
 * @param {number[]} taxIds - Array of tax IDs
 */
export function setProductTaxes(productId: number, taxIds: number[]): void {
    // This function is deprecated as products now use tax_category_id
    // Keeping for backward compatibility but does nothing
    return;
}
