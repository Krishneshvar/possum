/**
 * Inventory Helper Utilities
 * Provides stock calculation and validation functions
 */
import { getDB } from '../db/index.js';
import type { IInventoryRepository } from '../../../../core/index.js';

/**
 * Get computed stock for a variant
 * Stock = SUM(inventory_lots.quantity) + SUM(inventory_adjustments.quantity_change)
 * @param {number} variantId - Variant ID
 * @param {IInventoryRepository} inventoryRepository - Inventory repository instance
 * @returns {Promise<number>} Computed stock quantity
 */
export async function getComputedStock(variantId: number, inventoryRepository: IInventoryRepository): Promise<number> {
    return new Promise((resolve) => {
        setImmediate(() => {
            const stock = inventoryRepository.getStockByVariantId(variantId);
            resolve(stock);
        });
    });
}

/**
 * Get computed stock for multiple variants
 * @param {number[]} variantIds - Array of variant IDs
 * @param {IInventoryRepository} inventoryRepository - Inventory repository instance
 * @returns {Promise<Record<number, number>>} Map of variantId -> stock
 */
export async function getComputedStockBatch(variantIds: number[], inventoryRepository: IInventoryRepository): Promise<Record<number, number>> {
    if (!variantIds || variantIds.length === 0) {
        return {};
    }

    return new Promise((resolve) => {
        setImmediate(() => {
            const stockMap: Record<number, number> = {};
            for (const variantId of variantIds) {
                stockMap[variantId] = inventoryRepository.getStockByVariantId(variantId);
            }
            resolve(stockMap);
        });
    });
}

/**
 * Validate that sufficient stock is available
 * @param {number} variantId - Variant ID
 * @param {number} requiredQty - Required quantity
 * @param {IInventoryRepository} inventoryRepository - Inventory repository instance
 * @throws {Error} If insufficient stock
 */
export async function validateStockAvailable(variantId: number, requiredQty: number, inventoryRepository: IInventoryRepository): Promise<void> {
    const currentStock = await getComputedStock(variantId, inventoryRepository);
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
 * @param {IInventoryRepository} inventoryRepository - Inventory repository instance
 * @returns {Promise<Object>} Stock status with quantity and status label
 */
export async function getStockStatus(variantId: number, inventoryRepository: IInventoryRepository): Promise<{ stock: number; status: string; alertCap: number }> {
    const stock = await getComputedStock(variantId, inventoryRepository);

    return new Promise((resolve) => {
        setImmediate(() => {
            const db = getDB();
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

            resolve({ stock, status, alertCap });
        });
    });
}
