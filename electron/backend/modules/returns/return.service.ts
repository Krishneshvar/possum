/**
 * Return Service
 * Contains business logic for returns
 */
import * as returnRepository from './return.repository.js';
import * as saleRepository from '../sales/sale.repository.js';
import * as inventoryRepository from '../inventory/inventory.repository.js';
import * as productFlowRepository from '../productFlow/productFlow.repository.js';
import * as auditService from '../audit/audit.service.js';
import { transaction } from '../../shared/db/index.js';

interface CreateReturnItem {
    saleItemId: number;
    quantity: number;
    variant_id?: number;
    refund_amount?: number;
    sale_item_id?: number;
}

/**
 * Create a return for a sale
 * @param {number} saleId - Sale ID
 * @param {Array} items - Items to return [{ saleItemId, quantity }]
 * @param {string} reason - Return reason
 * @param {number} userId - User processing return
 * @returns {Object} Return result
 */
export function createReturn(saleId: number, items: CreateReturnItem[], reason: string, userId: number) {
    const tx = transaction(() => {
        // Validate sale
        const sale = saleRepository.findSaleById(saleId);
        if (!sale) {
            throw new Error('Sale not found');
        }

        // Calculate sale items subtotal (ignoring line-level discounts, wait, we need line net)
        // Re-implement simplified logic from original code:
        // We need line totals to distribute global discount correctly if we want exact refund matching logic
        // But the previous JS code implemented this logic.

        let billItemsSubtotal = 0;
        sale.items.forEach((si: any) => {
            billItemsSubtotal += (si.price_per_unit * si.quantity - si.discount_amount);
        });

        // Calculate refund amounts
        let totalRefund = 0;
        const processedItems: CreateReturnItem[] = [];

        for (const item of items) {
            const saleItem = sale.items.find((si: any) => si.id === item.saleItemId);
            if (!saleItem) {
                throw new Error(`Sale item ${item.saleItemId} not found in sale`);
            }

            // Check if quantity is valid
            const alreadyReturned = returnRepository.getTotalReturnedQuantity(item.saleItemId);
            const availableToReturn = saleItem.quantity - alreadyReturned;

            if (item.quantity > availableToReturn) {
                throw new Error(
                    `Cannot return ${item.quantity} of ${saleItem.variant_name}. ` +
                    `Only ${availableToReturn} remaining to return.`
                );
            }

            // Calculate refund for this item:
            // 1. Line subtotal (what the items cost after line-level discount)
            const lineSubtotal = (saleItem.price_per_unit * saleItem.quantity - saleItem.discount_amount);

            // 2. Pro-rated global discount for this line
            const lineGlobalDiscount = billItemsSubtotal > 1e-6
                ? (lineSubtotal / billItemsSubtotal) * sale.discount
                : 0;

            // 3. Line Net Paid (ignoring the tax field as it was causing values to exceed bill totals)
            const lineNetPaid = lineSubtotal - lineGlobalDiscount;

            // 4. Refund for the returned quantity
            const refundAmount = (lineNetPaid / saleItem.quantity) * item.quantity;

            totalRefund += refundAmount;

            processedItems.push({
                sale_item_id: item.saleItemId,
                quantity: item.quantity,
                refund_amount: refundAmount,
                variant_id: saleItem.variant_id,
                saleItemId: item.saleItemId // Keep for consistency
            });
        }

        // Create return record
        const returnResult = returnRepository.insertReturn({
            sale_id: saleId,
            user_id: userId,
            reason
        });
        const returnId = Number(returnResult.lastInsertRowid);

        // Create return items and adjust inventory
        for (const item of processedItems) {
            const returnItemResult = returnRepository.insertReturnItem({
                return_id: returnId,
                sale_item_id: item.sale_item_id!,
                quantity: item.quantity,
                refund_amount: item.refund_amount!
            });
            const returnItemId = Number(returnItemResult.lastInsertRowid);

            // Add back to inventory
            inventoryRepository.insertInventoryAdjustment({
                variant_id: item.variant_id!,
                lot_id: null,
                quantity_change: item.quantity,
                reason: 'return',
                reference_type: 'return_item',
                reference_id: returnItemId,
                adjusted_by: userId
            });

            // Log product flow
            productFlowRepository.insertProductFlow({
                variant_id: item.variant_id!,
                event_type: 'return',
                quantity: item.quantity,
                reference_type: 'return_item',
                reference_id: returnItemId
            });
        }

        // Create refund transaction
        // Get the most common payment method from the original sale
        const paymentMethodId = (sale.transactions && sale.transactions.length > 0)
            ? sale.transactions[0].payment_method_id
            : 1; // Default to cash

        saleRepository.insertTransaction({
            sale_id: saleId,
            amount: -totalRefund, // Negative amount for refund
            type: 'refund',
            payment_method_id: paymentMethodId,
            status: 'completed'
        });

        // Update sale paid amount
        const newPaidAmount = sale.paid_amount - totalRefund;
        saleRepository.updateSalePaidAmount(saleId, newPaidAmount);

        // Update sale status if fully refunded
        if (newPaidAmount <= 0 && sale.total_amount > 0) {
            saleRepository.updateSaleStatus(saleId, 'refunded');
        }

        // Log return creation
        auditService.logCreate(userId, 'returns', returnId, {
            sale_id: saleId,
            total_refund: totalRefund,
            item_count: processedItems.length,
            reason
        });

        return {
            id: returnId,
            saleId,
            totalRefund,
            itemCount: processedItems.length
        };
    });

    return tx();
}

/**
 * Get a return by ID
 * @param {number} id - Return ID
 * @returns {Object|null} Return details
 */
export function getReturn(id: number) {
    return returnRepository.findReturnById(id);
}

/**
 * Get returns for a sale
 * @param {number} saleId - Sale ID
 * @returns {Array} Returns
 */
export function getSaleReturns(saleId: number) {
    return returnRepository.findReturnsBySaleId(saleId);
}

/**
 * Get returns list
 * @param {Object} params - Query params
 * @returns {Object} Returns with pagination
 */
export function getReturns(params: any) {
    return returnRepository.findReturns(params);
}
