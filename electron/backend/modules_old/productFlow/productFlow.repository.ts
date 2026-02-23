/**
 * Product Flow Repository
 * Handles all database operations for product flow analysis
 */
import { getDB } from '../../shared/db/index.js';

export interface ProductFlowEvent {
    id: number;
    variant_id: number;
    event_type: 'purchase' | 'sale' | 'return' | 'adjustment';
    quantity: number;
    reference_type: string | null;
    reference_id: number | null;
    event_date: string;
    variant_name?: string;
    product_name?: string;
    payment_method_names?: string;
}

export interface ProductFlowSummary {
    totalPurchased: number;
    totalSold: number;
    totalReturned: number;
    totalLost: number;
    totalGained: number;
    totalEvents: number;
    netMovement: number;
}

export interface FlowQueryOptions {
    limit?: number;
    offset?: number;
    startDate?: string | null;
    endDate?: string | null;
    paymentMethods?: string[];
}

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
}: {
    variant_id: number;
    event_type: string;
    quantity: number;
    reference_type?: string | null;
    reference_id?: number | null;
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
export function findFlowByVariantId(variantId: number, {
    limit = 100,
    offset = 0,
    startDate,
    endDate,
    paymentMethods
}: FlowQueryOptions = {}) {
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

    const params: any[] = [variantId];

    if (startDate) {
        sql += ` AND pf.event_date >= ?`;
        params.push(startDate);
    }
    if (endDate) {
        sql += ` AND pf.event_date <= ?`;
        params.push(endDate);
    }

    if (paymentMethods && paymentMethods.length > 0) {
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

    return db.prepare(sql).all(...params) as ProductFlowEvent[];
}

/**
 * Get flow summary for a variant (aggregate in/out quantities)
 * @param {number} variantId - Variant ID
 * @returns {Object} Flow summary
 */
export function getFlowSummary(variantId: number): ProductFlowSummary {
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
    `).get(variantId) as any;

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
export function findFlowByReference(referenceType: string, referenceId: number) {
    const db = getDB();
    return db.prepare(`
        SELECT * FROM product_flow
        WHERE reference_type = ? AND reference_id = ?
        ORDER BY event_date DESC
    `).all(referenceType, referenceId) as ProductFlowEvent[];
}
