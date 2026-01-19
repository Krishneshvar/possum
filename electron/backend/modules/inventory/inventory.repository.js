/**
 * Inventory Repository
 * Handles all database operations for inventory management
 */
import { getDB } from '../../shared/db/index.js';

/**
 * Get computed stock for a variant
 * Stock = SUM(inventory_lots.quantity) + SUM(inventory_adjustments.quantity_change)
 * @param {number} variantId - Variant ID
 * @returns {number} Computed stock
 */
export function getStockByVariantId(variantId) {
    const db = getDB();
    const result = db.prepare(`
        SELECT 
            COALESCE(
                (SELECT SUM(quantity) FROM inventory_lots WHERE variant_id = ?),
                0
            ) + COALESCE(
                (SELECT SUM(quantity_change) FROM inventory_adjustments WHERE variant_id = ? AND reason != 'confirm_receive'),
                0
            ) AS stock
    `).get(variantId, variantId);

    return result?.stock ?? 0;
}

/**
 * Get all inventory lots for a variant
 * @param {number} variantId - Variant ID
 * @returns {Array} Inventory lots with details
 */
export function findLotsByVariantId(variantId) {
    const db = getDB();
    return db.prepare(`
        SELECT 
            il.*,
            poi.purchase_order_id,
            po.order_date
        FROM inventory_lots il
        LEFT JOIN purchase_order_items poi ON il.purchase_order_item_id = poi.id
        LEFT JOIN purchase_orders po ON poi.purchase_order_id = po.id
        WHERE il.variant_id = ?
        ORDER BY il.created_at DESC
    `).all(variantId);
}

/**
 * Get inventory adjustments for a variant
 * @param {number} variantId - Variant ID
 * @param {Object} options - Query options
 * @returns {Array} Inventory adjustments
 */
export function findAdjustmentsByVariantId(variantId, { limit = 50, offset = 0 } = {}) {
    const db = getDB();
    return db.prepare(`
        SELECT 
            ia.*,
            u.name as adjusted_by_name,
            il.batch_number as lot_batch_number
        FROM inventory_adjustments ia
        LEFT JOIN users u ON ia.adjusted_by = u.id
        LEFT JOIN inventory_lots il ON ia.lot_id = il.id
        WHERE ia.variant_id = ?
        ORDER BY ia.adjusted_at DESC
        LIMIT ? OFFSET ?
    `).all(variantId, limit, offset);
}

/**
 * Insert a new inventory lot
 * @param {Object} lotData - Lot data
 * @returns {Object} Insert result
 */
export function insertInventoryLot({
    variant_id,
    batch_number,
    manufactured_date,
    expiry_date,
    quantity,
    unit_cost,
    purchase_order_item_id
}) {
    const db = getDB();
    const stmt = db.prepare(`
        INSERT INTO inventory_lots (
            variant_id, batch_number, manufactured_date, expiry_date, 
            quantity, unit_cost, purchase_order_item_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
        variant_id,
        batch_number || null,
        manufactured_date || null,
        expiry_date || null,
        quantity,
        unit_cost,
        purchase_order_item_id || null
    );
}

/**
 * Insert an inventory adjustment
 * @param {Object} adjustmentData - Adjustment data
 * @returns {Object} Insert result
 */
export function insertInventoryAdjustment({
    variant_id,
    lot_id,
    quantity_change,
    reason,
    reference_type,
    reference_id,
    adjusted_by
}) {
    const db = getDB();
    const stmt = db.prepare(`
        INSERT INTO inventory_adjustments (
            variant_id, lot_id, quantity_change, reason,
            reference_type, reference_id, adjusted_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
        variant_id,
        lot_id || null,
        quantity_change,
        reason,
        reference_type || null,
        reference_id || null,
        adjusted_by
    );
}

/**
 * Find a lot by ID
 * @param {number} id - Lot ID
 * @returns {Object|null} Lot or null
 */
export function findLotById(id) {
    const db = getDB();
    return db.prepare('SELECT * FROM inventory_lots WHERE id = ?').get(id);
}

/**
 * Get all variants with low stock (stock <= stock_alert_cap)
 * @returns {Array} Variants with low stock
 */
export function findLowStockVariants() {
    const db = getDB();
    return db.prepare(`
        SELECT 
            v.id,
            v.name as variant_name,
            v.sku,
            v.stock_alert_cap,
            p.id as product_id,
            p.name as product_name,
            p.image_path,
            (
                COALESCE((SELECT SUM(quantity) FROM inventory_lots WHERE variant_id = v.id), 0)
                + COALESCE((SELECT SUM(quantity_change) FROM inventory_adjustments WHERE variant_id = v.id AND reason != 'confirm_receive'), 0)
            ) AS current_stock
        FROM variants v
        JOIN products p ON v.product_id = p.id
        WHERE v.deleted_at IS NULL AND p.deleted_at IS NULL
        HAVING current_stock <= v.stock_alert_cap
        ORDER BY current_stock ASC
    `).all();
}

/**
 * Get expiring lots (within specified days)
 * @param {number} days - Number of days to look ahead
 * @returns {Array} Expiring lots
 */
export function findExpiringLots(days = 30) {
    const db = getDB();
    return db.prepare(`
        SELECT 
            il.*,
            v.name as variant_name,
            v.sku,
            p.name as product_name
        FROM inventory_lots il
        JOIN variants v ON il.variant_id = v.id
        JOIN products p ON v.product_id = p.id
        WHERE il.expiry_date IS NOT NULL 
          AND il.expiry_date <= date('now', '+' || ? || ' days')
          AND il.expiry_date >= date('now')
          AND v.deleted_at IS NULL
        ORDER BY il.expiry_date ASC
    `).all(days);
}
