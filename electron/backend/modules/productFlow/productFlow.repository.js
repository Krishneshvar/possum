/**
 * Product Flow Repository
 * Handles all database operations for product flow analysis
 */
import { getDB } from '../../shared/db/index.js';

/**
 * Insert a product flow event
 * @param {Object} flowData - Flow event data
 * @returns {Object} Insert result
 */
export function insertProductFlow({
    variant_id,
    event_type,
    quantity,
    reference_type,
    reference_id
}) {
    const db = getDB();
    const stmt = db.prepare(`
        INSERT INTO product_flow (
            variant_id, event_type, quantity,
            reference_type, reference_id
        )
        VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(
        variant_id,
        event_type,
        quantity,
        reference_type || null,
        reference_id || null
    );
}

/**
 * Find product flow events for a variant
 * @param {number} variantId - Variant ID
 * @param {Object} options - Query options
 * @returns {Array} Flow events
 */
export function findFlowByVariantId(variantId, { limit = 100, offset = 0, startDate, endDate } = {}) {
    const db = getDB();
    let sql = `
        SELECT 
            pf.*,
            v.name as variant_name,
            p.name as product_name
        FROM product_flow pf
        JOIN variants v ON pf.variant_id = v.id
        JOIN products p ON v.product_id = p.id
        WHERE pf.variant_id = ?
    `;
    const params = [variantId];

    if (startDate) {
        sql += ` AND pf.event_date >= ?`;
        params.push(startDate);
    }
    if (endDate) {
        sql += ` AND pf.event_date <= ?`;
        params.push(endDate);
    }

    sql += ` ORDER BY pf.event_date DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return db.prepare(sql).all(...params);
}

/**
 * Get flow summary for a variant (aggregate in/out quantities)
 * @param {number} variantId - Variant ID
 * @returns {Object} Flow summary
 */
export function getFlowSummary(variantId) {
    const db = getDB();
    const result = db.prepare(`
        SELECT 
            SUM(CASE WHEN event_type = 'purchase' THEN quantity ELSE 0 END) as total_purchased,
            SUM(CASE WHEN event_type = 'sale' THEN ABS(quantity) ELSE 0 END) as total_sold,
            SUM(CASE WHEN event_type = 'return' THEN quantity ELSE 0 END) as total_returned,
            SUM(CASE WHEN event_type = 'adjustment' AND quantity < 0 THEN ABS(quantity) ELSE 0 END) as total_lost,
            SUM(CASE WHEN event_type = 'adjustment' AND quantity > 0 THEN quantity ELSE 0 END) as total_gained,
            COUNT(*) as total_events
        FROM product_flow
        WHERE variant_id = ?
    `).get(variantId);

    return {
        totalPurchased: result?.total_purchased ?? 0,
        totalSold: result?.total_sold ?? 0,
        totalReturned: result?.total_returned ?? 0,
        totalLost: result?.total_lost ?? 0,
        totalGained: result?.total_gained ?? 0,
        totalEvents: result?.total_events ?? 0,
        netMovement: (result?.total_purchased ?? 0) + (result?.total_returned ?? 0) + (result?.total_gained ?? 0)
            - (result?.total_sold ?? 0) - (result?.total_lost ?? 0)
    };
}

/**
 * Find flow events by reference
 * @param {string} referenceType - Reference type
 * @param {number} referenceId - Reference ID
 * @returns {Array} Flow events
 */
export function findFlowByReference(referenceType, referenceId) {
    const db = getDB();
    return db.prepare(`
        SELECT * FROM product_flow
        WHERE reference_type = ? AND reference_id = ?
        ORDER BY event_date DESC
    `).all(referenceType, referenceId);
}
