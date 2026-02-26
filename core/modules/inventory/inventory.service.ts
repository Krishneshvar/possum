/**
 * Inventory Service
 * Contains business logic for inventory operations
 */
import { IInventoryRepository } from './inventory.repository.interface.js';
import { VALID_INVENTORY_REASONS, INVENTORY_REASONS } from '../../../types/index.js';

let inventoryRepository: IInventoryRepository;
let productFlowService: any;
let auditService: any;
let transaction: any;

export function initInventoryService(
    repo: IInventoryRepository,
    pfService: any,
    audit: any,
    txFn: any
) {
    inventoryRepository = repo;
    productFlowService = pfService;
    auditService = audit;
    transaction = txFn;
}

/**
 * Get stock for a variant
 * @param {number} variantId - Variant ID
 * @returns {Object} Stock info
 */
export function getVariantStock(variantId: number) {
    const stock = inventoryRepository.getStockByVariantId(variantId);
    return { variantId, stock };
}

/**
 * Get inventory lots for a variant
 * @param {number} variantId - Variant ID
 * @returns {Array} Lots list
 */
export function getVariantLots(variantId: number) {
    return inventoryRepository.findLotsByVariantId(variantId);
}

/**
 * Get inventory adjustments for a variant
 * @param {number} variantId - Variant ID
 * @param {Object} options - Query options
 * @returns {Array} Adjustments list
 */
export function getVariantAdjustments(variantId: number, options: { limit?: number; offset?: number } = {}) {
    return inventoryRepository.findAdjustmentsByVariantId(variantId, options);
}

/**
 * Get all stock adjustments (paginated, searchable, filterable)
 */
export function getAllAdjustments(options: {
    limit?: number;
    offset?: number;
    search?: string;
    reason?: string;
    variantId?: number | null;
    sortBy?: string;
    sortOrder?: string;
} = {}) {
    return inventoryRepository.findAllAdjustments(options);
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
}: {
    variantId: number;
    lotId?: number | null;
    quantityChange: number;
    reason: string;
    referenceType?: string | null;
    referenceId?: number | null;
    userId: number;
}) {
    // Validate reason before transaction
    const validReasons = VALID_INVENTORY_REASONS as unknown as string[];
    if (!validReasons.includes(reason)) {
        throw new Error(`Invalid adjustment reason: ${reason}. Must be one of: ${validReasons.join(', ')}`);
    }

    // Validate stock availability BEFORE transaction for negative adjustments
    if (quantityChange < 0) {
        const currentStock = inventoryRepository.getStockByVariantId(variantId);
        if (currentStock + quantityChange < 0) {
            const error = new Error(`Insufficient stock. Available: ${currentStock}, Requested adjustment: ${quantityChange}`);
            (error as any).code = 'INSUFFICIENT_STOCK';
            throw error;
        }
    }

    const tx = transaction(() => {
        // Handle FIFO deduction if no lotId is provided for negative adjustment
        if (quantityChange < 0 && !lotId) {
            deductStockInternal({
                variantId,
                quantity: Math.abs(quantityChange),
                userId,
                reason,
                referenceType,
                referenceId
            });

            const newStock = inventoryRepository.getStockByVariantId(variantId);
            return {
                id: 0, // Multiple adjustments created
                variantId,
                quantityChange,
                reason,
                newStock
            };
        }

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

        const adjustmentId = Number(adjustmentResult.lastInsertRowid);
        const newStock = inventoryRepository.getStockByVariantId(variantId);

        // Queue cross-module operations for post-transaction execution
        const eventType = reason === INVENTORY_REASONS.SALE ? 'sale'
            : reason === INVENTORY_REASONS.RETURN ? 'return'
                : reason === INVENTORY_REASONS.CONFIRM_RECEIVE ? 'adjustment'
                    : 'adjustment';

        productFlowService.logProductFlow({
            variantId,
            eventType,
            quantity: quantityChange,
            referenceType: referenceType || 'adjustment',
            referenceId: referenceId || adjustmentId
        });

        auditService.logCreate(
            userId,
            'inventory_adjustments',
            adjustmentId,
            {
                variant_id: variantId,
                quantity_change: quantityChange,
                reason,
                new_stock: newStock
            }
        );

        return {
            id: adjustmentId,
            variantId,
            quantityChange,
            reason,
            newStock
        };
    });

    return tx.immediate();
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
export function getExpiringLots(days: number = 30) {
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
}: {
    variantId: number;
    quantity: number;
    unitCost: number;
    batchNumber?: string | null;
    manufacturedDate?: string | null;
    expiryDate?: string | null;
    purchaseOrderItemId?: number | null;
    userId: number;
}) {
    const tx = transaction(() => {
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

        const lotId = Number(lotResult.lastInsertRowid);

        // Create adjustment for the receipt
        inventoryRepository.insertInventoryAdjustment({
            variant_id: variantId,
            lot_id: lotId,
            quantity_change: quantity,
            reason: INVENTORY_REASONS.CONFIRM_RECEIVE,
            reference_type: 'purchase_order_item',
            reference_id: purchaseOrderItemId,
            adjusted_by: userId
        });

        const newStock = inventoryRepository.getStockByVariantId(variantId);

        // Queue cross-module operations
        productFlowService.logProductFlow({
            variantId,
            eventType: 'purchase',
            quantity,
            referenceType: 'purchase_order_item',
            referenceId: purchaseOrderItemId
        });

        auditService.logCreate(
            userId,
            'inventory_lots',
            lotId,
            {
                variant_id: variantId,
                quantity,
                unit_cost: unitCost,
                batch_number: batchNumber,
                new_stock: newStock
            }
        );

        return {
            lotId,
            variantId,
            quantity,
            newStock
        };
    });

    return tx.immediate();
}

/**
 * Internal FIFO deduction logic without transaction wrapper
 */
function deductStockInternal({
    variantId,
    quantity,
    userId,
    reason,
    referenceType,
    referenceId
}: {
    variantId: number;
    quantity: number;
    userId: number;
    reason: string;
    referenceType?: string | null;
    referenceId?: number | null;
}) {
    let remainingToDeduct = quantity;
    const availableLots = inventoryRepository.findAvailableLots(variantId);

    for (const lot of availableLots) {
        if (remainingToDeduct <= 0) break;

        const deductionFromThisLot = Math.min(remainingToDeduct, lot.remaining_quantity);

        inventoryRepository.insertInventoryAdjustment({
            variant_id: variantId,
            lot_id: lot.id,
            quantity_change: -deductionFromThisLot,
            reason,
            reference_type: referenceType,
            reference_id: referenceId,
            adjusted_by: userId
        });

        remainingToDeduct -= deductionFromThisLot;
    }

    // If still remainingToDeduct > 0 (headless stock or negative stock allowed)
    if (remainingToDeduct > 0) {
        inventoryRepository.insertInventoryAdjustment({
            variant_id: variantId,
            lot_id: null,
            quantity_change: -remainingToDeduct,
            reason,
            reference_type: referenceType,
            reference_id: referenceId,
            adjusted_by: userId
        });
    }

    // Queue product flow logging
    const eventType = reason === INVENTORY_REASONS.SALE ? 'sale' : 'adjustment';
    productFlowService.logProductFlow({
        variantId,
        eventType,
        quantity: -quantity,
        referenceType: referenceType || 'adjustment',
        referenceId
    });

    return { success: true, deducted: quantity };
}

/**
 * Automatically deduct inventory stock from available lots (FIFO)
 * @param {Object} params - Deduction parameters
 * @returns {Object} Result
 */
export function deductStock(params: {
    variantId: number;
    quantity: number;
    userId: number;
    reason: string;
    referenceType?: string | null;
    referenceId?: number | null;
}) {
    if (params.quantity <= 0) return { success: true, deducted: 0 };
    const tx = transaction(() => deductStockInternal(params));
    return tx.immediate();
}

/**
 * Restore stock to lots by reversing previous adjustments
 */
export function restoreStock({
    variantId,
    referenceType,
    referenceId,
    quantity,
    userId,
    reason,
    newReferenceType,
    newReferenceId
}: {
    variantId: number;
    referenceType: string;
    referenceId: number;
    quantity: number;
    userId: number;
    reason: string;
    newReferenceType?: string | null;
    newReferenceId?: number | null;
}) {
    if (quantity <= 0) return { success: true, restored: 0 };

    const tx = transaction(() => {
        const originalAdjustments = inventoryRepository.findAdjustmentsByReference(referenceType, referenceId);
        let remainingToRestore = quantity;

        // Sort by adjusted_at DESC to reverse LIFO (reverse of FIFO deduction)
        originalAdjustments.sort((a, b) => new Date(b.adjusted_at).getTime() - new Date(a.adjusted_at).getTime());

        for (const adj of originalAdjustments) {
            if (remainingToRestore <= 0) break;

            const originalDeduction = Math.abs(adj.quantity_change);
            const restoreToThisLot = Math.min(remainingToRestore, originalDeduction);

            inventoryRepository.insertInventoryAdjustment({
                variant_id: variantId,
                lot_id: adj.lot_id,
                quantity_change: restoreToThisLot,
                reason,
                reference_type: newReferenceType,
                reference_id: newReferenceId,
                adjusted_by: userId
            });

            remainingToRestore -= restoreToThisLot;
        }

        // If still remaining (headless stock or something went wrong)
        if (remainingToRestore > 0) {
            inventoryRepository.insertInventoryAdjustment({
                variant_id: variantId,
                lot_id: null,
                quantity_change: remainingToRestore,
                reason,
                reference_type: newReferenceType,
                reference_id: newReferenceId,
                adjusted_by: userId
            });
        }

        // Queue product flow logging
        const eventType = reason === INVENTORY_REASONS.RETURN ? 'return' : 'adjustment';
        productFlowService.logProductFlow({
            variantId,
            eventType,
            quantity: quantity,
            referenceType: newReferenceType || 'adjustment',
            referenceId: newReferenceId
        });

        return { success: true, restored: quantity };
    });

    return tx.immediate();
}

/**
 * Get aggregate inventory stats
 * @returns {Object} Inventory stats
 */
export function getInventoryStats() {
    return inventoryRepository.getInventoryStats();
}
