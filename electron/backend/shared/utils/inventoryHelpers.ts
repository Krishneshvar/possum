/**
 * Inventory Helper Utilities
 * Provides stock calculation and validation functions
 */
import { getDB } from '../db/index.js';

/**
 * Get computed stock for a variant
 * Stock = SUM(inventory_lots.quantity) + SUM(inventory_adjustments.quantity_change)
 * @param {number} variantId - Variant ID
 * @returns {number} Computed stock quantity
 */
export function getComputedStock(variantId: number): number {
    const db = getDB();
    const stmt = db.prepare(`
        SELECT 
            COALESCE(
                (SELECT SUM(quantity) FROM inventory_lots WHERE variant_id = ?),
                0
            ) + COALESCE(
                (SELECT SUM(quantity_change) FROM inventory_adjustments WHERE variant_id = ? AND reason != 'confirm_receive'),
                0
            ) AS stock
    `);

    const result = stmt.get(variantId, variantId) as { stock: number } | undefined;

    return result?.stock ?? 0;
}

/**
 * Get computed stock for multiple variants
 * @param {number[]} variantIds - Array of variant IDs
 * @returns {Object} Map of variantId -> stock
 */
export function getComputedStockBatch(variantIds: number[]): Record<number, number> {
    if (!variantIds || variantIds.length === 0) {
        return {};
    }

    const db = getDB();
    const placeholders = variantIds.map(() => '?').join(',');

    const stmt = db.prepare(`
        SELECT 
            v.id as variant_id,
            COALESCE(
                (SELECT SUM(quantity) FROM inventory_lots WHERE variant_id = v.id),
                0
            ) + COALESCE(
                (SELECT SUM(quantity_change) FROM inventory_adjustments WHERE variant_id = v.id AND reason != 'confirm_receive'),
                0
            ) AS stock
        FROM variants v
        WHERE v.id IN (${placeholders})
    `);

    const results = stmt.all(...variantIds) as Array<{ variant_id: number; stock: number }>;

    const stockMap: Record<number, number> = {};
    for (const row of results) {
        stockMap[row.variant_id] = row.stock;
    }
    return stockMap;
}

/**
 * Validate that sufficient stock is available
 * @param {number} variantId - Variant ID
 * @param {number} requiredQty - Required quantity
 * @throws {Error} If insufficient stock
 */
export function validateStockAvailable(variantId: number, requiredQty: number): void {
    const currentStock = getComputedStock(variantId);
    if (currentStock < requiredQty) {
        const error = new Error(`Insufficient stock for variant ${variantId}. Available: ${currentStock}, Required: ${requiredQty}`);
        (error as any).code = 'INSUFFICIENT_STOCK';
        (error as any).availableStock = currentStock;
        (error as any).requiredQty = requiredQty;
        throw error;
    }
}

/**
 * Get stock status for a variant based on stock_alert_cap
 * @param {number} variantId - Variant ID
 * @returns {Object} Stock status with quantity and status label
 */
export function getStockStatus(variantId: number): { stock: number; status: string; alertCap: number } {
    const db = getDB();
    const stock = getComputedStock(variantId);

    const variant = db.prepare(`
        SELECT stock_alert_cap FROM variants WHERE id = ?
    `).get(variantId) as { stock_alert_cap: number } | undefined;

    const alertCap = variant?.stock_alert_cap ?? 10;

    let status = 'in-stock';
    if (stock === 0) {
        status = 'out-of-stock';
    } else if (stock <= alertCap) {
        status = 'low-stock';
    }

    return { stock, status, alertCap };
}
