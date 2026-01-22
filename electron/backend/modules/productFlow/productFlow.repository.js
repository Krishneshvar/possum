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
export function findFlowByVariantId(variantId, {
    limit = 100,
    offset = 0,
    startDate,
    endDate,
    paymentMethods
} = {}) {
    const db = getDB();

    // Base columns
    let sql = `
        SELECT 
            pf.*,
            v.name as variant_name,
            p.name as product_name,
            -- Payment method aggregation for sale events
            GROUP_CONCAT(DISTINCT pm.name) as payment_method_names
        FROM product_flow pf
        JOIN variants v ON pf.variant_id = v.id
        JOIN products p ON v.product_id = p.id
        
        -- Joins to reach payment info (only relevant for 'sale' events pointing to sale_items)
        LEFT JOIN sale_items si ON (pf.reference_type = 'sale_item' AND pf.reference_id = si.id)
        LEFT JOIN sales s ON si.sale_id = s.id
        LEFT JOIN transactions t ON (s.id = t.sale_id AND t.type = 'payment' AND t.status = 'completed')
        LEFT JOIN payment_methods pm ON t.payment_method_id = pm.id
        
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

    if (paymentMethods && paymentMethods.length > 0) {
        // If filtering by payment method, we only care about 'sale' events that match,
        // OR non-sale events if we want to include them? 
        // Requirement said "view between specific ... type of payment ... for the bill in which the variant was billed"
        // This implies filtering is primarily for sales. 
        // If we filter by payment method X, should we hide purchases/returns?
        // Usually, filtering implies narrowing down to matching rows. If a purchase doesn't have a payment method context here, it might be excluded.
        // Let's assume strict filtering: only show rows matching the criterion. 
        // Since only sales have this payment info linked this way, this will naturally exclude non-sales unless we handle them.
        // HOWEVER, logical "OR" behavior (show me sales with Card OR purchases) isn't requested.
        // "options to view ... type of payment that was done for the bill"
        // Logic: specific filter active -> must match.

        const placeholders = paymentMethods.map(() => '?').join(',');
        sql += ` AND pm.name IN (${placeholders})`;
        params.push(...paymentMethods);
    }

    sql += ` 
        GROUP BY pf.id
        ORDER BY pf.event_date DESC 
        LIMIT ? OFFSET ?
    `;
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
