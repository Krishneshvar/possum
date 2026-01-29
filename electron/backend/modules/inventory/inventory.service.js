/**
 * Inventory Service
 * Contains business logic for inventory operations
 */
import * as inventoryRepository from './inventory.repository.js';
import * as productFlowRepository from '../productFlow/productFlow.repository.js';
import * as auditService from '../audit/audit.service.js';
import { transaction } from '../../shared/db/index.js';

/**
 * Get stock for a variant
 * @param {number} variantId - Variant ID
 * @returns {Object} Stock info
 */
export function getVariantStock(variantId) {
    const stock = inventoryRepository.getStockByVariantId(variantId);
    return { variantId, stock };
}

/**
 * Get inventory lots for a variant
 * @param {number} variantId - Variant ID
 * @returns {Array} Lots list
 */
export function getVariantLots(variantId) {
    return inventoryRepository.findLotsByVariantId(variantId);
}

/**
 * Get inventory adjustments for a variant
 * @param {number} variantId - Variant ID
 * @param {Object} options - Query options
 * @returns {Array} Adjustments list
 */
export function getVariantAdjustments(variantId, options) {
    return inventoryRepository.findAdjustmentsByVariantId(variantId, options);
}

/**
 * Adjust inventory for a variant (creates adjustment record + product flow log)
 * @param {Object} params - Adjustment parameters
 * @returns {Object} Adjustment result
 */
export function adjustInventory({
    variantId,
    lotId,
    quantityChange,
    reason,
    referenceType,
    referenceId,
    userId
}) {
    // Valid reasons: 'sale', 'return', 'confirm_receive', 'spoilage', 'damage', 'theft', 'correction'
    const validReasons = ['sale', 'return', 'confirm_receive', 'spoilage', 'damage', 'theft', 'correction'];
    if (!validReasons.includes(reason)) {
        throw new Error(`Invalid adjustment reason: ${reason}. Must be one of: ${validReasons.join(', ')}`);
    }

    // Validate stock availability for negative adjustments
    if (quantityChange < 0) {
        const currentStock = inventoryRepository.getStockByVariantId(variantId);
        if (currentStock + quantityChange < 0) {
            const error = new Error(`Insufficient stock. Available: ${currentStock}, Requested adjustment: ${quantityChange}`);
            error.code = 'INSUFFICIENT_STOCK';
            throw error;
        }
    }

    return transaction(() => {
        // Create inventory adjustment
        const adjustmentResult = inventoryRepository.insertInventoryAdjustment({
            variant_id: variantId,
            lot_id: lotId,
            quantity_change: quantityChange,
            reason,
            reference_type: referenceType,
            reference_id: referenceId,
            adjusted_by: userId
        });

        // Log to product flow
        const eventType = reason === 'sale' ? 'sale'
            : reason === 'return' ? 'return'
                : reason === 'confirm_receive' ? 'adjustment' // or 'purchase' map? 'adjustment' is safer for manual
                    : 'adjustment';

        productFlowRepository.insertProductFlow({
            variant_id: variantId,
            event_type: eventType,
            quantity: quantityChange,
            reference_type: referenceType || 'adjustment',
            reference_id: referenceId || adjustmentResult.lastInsertRowid
        });

        const adjustmentId = adjustmentResult.lastInsertRowid;
        const newStock = inventoryRepository.getStockByVariantId(variantId);

        // Log inventory adjustment
        auditService.logCreate(userId, 'inventory_adjustments', adjustmentId, {
            variant_id: variantId,
            quantity_change: quantityChange,
            reason,
            new_stock: newStock
        });

        return {
            id: adjustmentId,
            variantId,
            quantityChange,
            reason,
            newStock
        };
    });
}

/**
 * Get all variants with low stock
 * @returns {Array} Low stock variants
 */
export function getLowStockAlerts() {
    return inventoryRepository.findLowStockVariants();
}

/**
 * Get expiring lots
 * @param {number} days - Days to look ahead
 * @returns {Array} Expiring lots
 */
export function getExpiringLots(days = 30) {
    return inventoryRepository.findExpiringLots(days);
}

/**
 * Receive inventory from purchase order
 * Creates lots and adjustments for each item
 * @param {Object} params - Receipt parameters
 * @returns {Object} Receipt result
 */
export function receiveInventory({
    variantId,
    quantity,
    unitCost,
    batchNumber,
    manufacturedDate,
    expiryDate,
    purchaseOrderItemId,
    userId
}) {
    return transaction(() => {
        // Create inventory lot
        const lotResult = inventoryRepository.insertInventoryLot({
            variant_id: variantId,
            batch_number: batchNumber,
            manufactured_date: manufacturedDate,
            expiry_date: expiryDate,
            quantity,
            unit_cost: unitCost,
            purchase_order_item_id: purchaseOrderItemId
        });

        const lotId = lotResult.lastInsertRowid;

        // Create adjustment for the receipt
        inventoryRepository.insertInventoryAdjustment({
            variant_id: variantId,
            lot_id: lotId,
            quantity_change: quantity,
            reason: 'confirm_receive',
            reference_type: 'purchase_order_item',
            reference_id: purchaseOrderItemId,
            adjusted_by: userId
        });

        // Log to product flow
        productFlowRepository.insertProductFlow({
            variant_id: variantId,
            event_type: 'purchase',
            quantity,
            reference_type: 'purchase_order_item',
            reference_id: purchaseOrderItemId
        });

        const newStock = inventoryRepository.getStockByVariantId(variantId);

        // Log inventory receipt
        auditService.logCreate(userId, 'inventory_lots', lotId, {
            variant_id: variantId,
            quantity,
            unit_cost: unitCost,
            batch_number: batchNumber,
            new_stock: newStock
        });

        return {
            lotId,
            variantId,
            quantity,
            newStock
        };
    });
}

/**
 * Get aggregate inventory stats
 * @returns {Object} Inventory stats
 */
export function getInventoryStats() {
    return inventoryRepository.getInventoryStats();
}
