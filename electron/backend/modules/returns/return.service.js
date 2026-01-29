/**
 * Return Service
 * Contains business logic for returns operations
 */
import * as returnRepository from './return.repository.js';
import * as saleRepository from '../sales/sale.repository.js';
import * as inventoryRepository from '../inventory/inventory.repository.js';
import * as productFlowRepository from '../productFlow/productFlow.repository.js';
import * as auditService from '../audit/audit.service.js';
import { transaction } from '../../shared/db/index.js';

/**
 * Create a return for a sale
 * @param {Object} params - Return parameters
 * @returns {Object} Created return
 */
export function createReturn({ saleId, items, reason, userId }) {
    return transaction(() => {
        // Get the sale
        const sale = saleRepository.findSaleById(saleId);
        if (!sale) {
            throw new Error('Sale not found');
        }

        if (sale.status === 'cancelled') {
            throw new Error('Cannot return items from a cancelled sale');
        }

        if (sale.status === 'draft') {
            throw new Error('Cannot return items from a draft sale');
        }

        // Validate items and calculate refund amounts
        let totalRefund = 0;
        const processedItems = [];

        for (const item of items) {
            const saleItem = sale.items.find(si => si.id === item.saleItemId);
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

            // Calculate refund for this item
            const pricePerUnit = saleItem.price_per_unit;
            const taxRate = saleItem.tax_rate;
            const itemSubtotal = pricePerUnit * item.quantity;
            const itemTax = itemSubtotal * taxRate;
            const refundAmount = itemSubtotal + itemTax;

            totalRefund += refundAmount;

            processedItems.push({
                sale_item_id: item.saleItemId,
                quantity: item.quantity,
                refund_amount: refundAmount,
                variant_id: saleItem.variant_id
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
                sale_item_id: item.sale_item_id,
                quantity: item.quantity,
                refund_amount: item.refund_amount
            });
            const returnItemId = Number(returnItemResult.lastInsertRowid);

            // Add back to inventory
            inventoryRepository.insertInventoryAdjustment({
                variant_id: item.variant_id,
                lot_id: null,
                quantity_change: item.quantity,
                reason: 'return',
                reference_type: 'return_item',
                reference_id: returnItemId,
                adjusted_by: userId
            });

            // Log product flow
            productFlowRepository.insertProductFlow({
                variant_id: item.variant_id,
                event_type: 'return',
                quantity: item.quantity,
                reference_type: 'return_item',
                reference_id: returnItemId
            });
        }

        // Create refund transaction
        // Get the most common payment method from the original sale
        const paymentMethodId = sale.transactions.length > 0
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
}

/**
 * Get a return by ID
 * @param {number} id - Return ID
 * @returns {Object|null} Return details
 */
export function getReturn(id) {
    return returnRepository.findReturnById(id);
}

/**
 * Get returns for a sale
 * @param {number} saleId - Sale ID
 * @returns {Array} Returns
 */
export function getSaleReturns(saleId) {
    return returnRepository.findReturnsBySaleId(saleId);
}

/**
 * Get returns list
 * @param {Object} params - Query params
 * @returns {Object} Returns with pagination
 */
export function getReturns(params) {
    return returnRepository.findReturns(params);
}
