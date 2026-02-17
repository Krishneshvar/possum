/**
 * Return Repository
 * Handles all database operations for returns
 */
import { getDB } from '../../shared/db/index.js';

/**
 * Insert a new return
 * @param {Object} returnData - Return data
 * @returns {Object} Insert result
 */
export function insertReturn({ sale_id, user_id, reason }: { sale_id: number; user_id: number; reason?: string }) {
    const db = getDB();
    const stmt = db.prepare(`
        INSERT INTO returns (sale_id, user_id, reason)
        VALUES (?, ?, ?)
    `);
    return stmt.run(sale_id, user_id, reason || null);
}

/**
 * Insert a return item
 * @param {Object} itemData - Return item data
 * @returns {Object} Insert result
 */
export function insertReturnItem({ return_id, sale_item_id, quantity, refund_amount }: { return_id: number; sale_item_id: number; quantity: number; refund_amount: number }) {
    const db = getDB();
    const stmt = db.prepare(`
        INSERT INTO return_items (return_id, sale_item_id, quantity, refund_amount)
        VALUES (?, ?, ?, ?)
    `);
    return stmt.run(return_id, sale_item_id, quantity, refund_amount);
}

/**
 * Find a return by ID with items
 * @param {number} id - Return ID
 * @returns {Object|null} Return with items
 */
export function findReturnById(id: number) {
    const db = getDB();

    const returnRecord = db.prepare(`
        SELECT 
            r.*,
            s.invoice_number,
            u.name as processed_by_name
        FROM returns r
        JOIN sales s ON r.sale_id = s.id
        JOIN users u ON r.user_id = u.id
        WHERE r.id = ?
    `).get(id);

    if (!returnRecord) return null;

    const items = db.prepare(`
        SELECT 
            ri.*,
            si.variant_id,
            si.price_per_unit,
            si.tax_rate,
            v.name as variant_name,
            v.sku,
            p.name as product_name
        FROM return_items ri
        JOIN sale_items si ON ri.sale_item_id = si.id
        JOIN variants v ON si.variant_id = v.id
        JOIN products p ON v.product_id = p.id
        WHERE ri.return_id = ?
    `).all(id);

    return {
        ...returnRecord,
        items
    };
}

/**
 * Find returns for a sale
 * @param {number} saleId - Sale ID
 * @returns {Array} Returns for the sale
 */
export function findReturnsBySaleId(saleId: number) {
    const db = getDB();
    return db.prepare(`
        SELECT 
            r.*,
            u.name as processed_by_name,
            (SELECT SUM(refund_amount) FROM return_items WHERE return_id = r.id) as total_refund
        FROM returns r
        JOIN users u ON r.user_id = u.id
        WHERE r.sale_id = ?
        ORDER BY r.created_at DESC
    `).all(saleId);
}

/**
 * Find all returns with pagination
 * @param {Object} params - Query params
 * @returns {Object} Returns with pagination
 */
export function findReturns({ saleId, userId, startDate, endDate, currentPage = 1, itemsPerPage = 20 }: { saleId?: number; userId?: number; startDate?: string; endDate?: string; currentPage?: number; itemsPerPage?: number }) {
    const db = getDB();
    const filterClauses: string[] = [];
    const filterParams: any[] = [];

    if (saleId) {
        filterClauses.push('r.sale_id = ?');
        filterParams.push(saleId);
    }

    if (userId) {
        filterClauses.push('r.user_id = ?');
        filterParams.push(userId);
    }

    if (startDate) {
        filterClauses.push('r.created_at >= ?');
        filterParams.push(startDate);
    }

    if (endDate) {
        filterClauses.push('r.created_at <= ?');
        filterParams.push(endDate);
    }

    const whereClause = filterClauses.length > 0
        ? `WHERE ${filterClauses.join(' AND ')}`
        : '';

    const countResult = db.prepare(`
        SELECT COUNT(*) as total_count FROM returns r ${whereClause}
    `).get(...filterParams) as { total_count: number };

    const totalCount = countResult?.total_count ?? 0;

    const offset = (currentPage - 1) * itemsPerPage;
    const returns = db.prepare(`
        SELECT 
            r.*,
            s.invoice_number,
            u.name as processed_by_name,
            (SELECT SUM(refund_amount) FROM return_items WHERE return_id = r.id) as total_refund
        FROM returns r
        JOIN sales s ON r.sale_id = s.id
        JOIN users u ON r.user_id = u.id
        ${whereClause}
        ORDER BY r.created_at DESC
        LIMIT ? OFFSET ?
    `).all(...filterParams, itemsPerPage, offset);

    return {
        returns,
        totalCount,
        totalPages: Math.ceil(totalCount / itemsPerPage),
        currentPage
    };
}

/**
 * Get total returned quantity for a sale item
 * @param {number} saleItemId - Sale item ID
 * @returns {number} Total returned quantity
 */
export function getTotalReturnedQuantity(saleItemId: number) {
    const db = getDB();
    const result = db.prepare(`
        SELECT COALESCE(SUM(quantity), 0) as total_returned
        FROM return_items
        WHERE sale_item_id = ?
    `).get(saleItemId) as { total_returned: number };
    return result?.total_returned ?? 0;
}
