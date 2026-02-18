/**
 * Return Service
 * Contains business logic for returns
 */
import { Decimal } from 'decimal.js';
import * as returnRepository from './return.repository.js';
import * as saleRepository from '../sales/sale.repository.js';
import * as inventoryRepository from '../inventory/inventory.repository.js';
import * as inventoryService from '../inventory/inventory.service.js';
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

        let billItemsSubtotal = new Decimal(0);
        sale.items.forEach((si: any) => {
            const lineSubtotal = new Decimal(si.price_per_unit).mul(si.quantity).sub(si.discount_amount);
            billItemsSubtotal = billItemsSubtotal.add(lineSubtotal);
        });

        // Calculate refund amounts
        let totalRefund = new Decimal(0);
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
            const linePricePerUnit = new Decimal(saleItem.price_per_unit);
            const lineQuantity = new Decimal(saleItem.quantity);
            const lineDiscountAmount = new Decimal(saleItem.discount_amount);
            const lineSubtotal = linePricePerUnit.mul(lineQuantity).sub(lineDiscountAmount);

            // 2. Pro-rated global discount for this line
            const saleGlobalDiscount = new Decimal(sale.discount);
            const lineGlobalDiscount = billItemsSubtotal.gt(0)
                ? lineSubtotal.div(billItemsSubtotal).mul(saleGlobalDiscount)
                : new Decimal(0);

            // 3. Line Net Paid
            const lineNetPaid = lineSubtotal.sub(lineGlobalDiscount);

            // 4. Refund for the returned quantity
            const refundAmount = lineNetPaid.div(lineQuantity).mul(item.quantity).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

            totalRefund = totalRefund.add(refundAmount);

            processedItems.push({
                sale_item_id: item.saleItemId,
                quantity: item.quantity,
                refund_amount: refundAmount.toNumber(),
                variant_id: saleItem.variant_id,
                saleItemId: item.saleItemId
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

            // Restore inventory using the original sale item's lot adjustments
            inventoryService.restoreStock({
                variantId: item.variant_id!,
                referenceType: 'sale_item',
                referenceId: item.sale_item_id!,
                quantity: item.quantity,
                userId,
                reason: 'return',
                newReferenceType: 'return_item',
                newReferenceId: returnItemId
            });
        }

        // Create refund transaction
        // Get the most common payment method from the original sale
        const paymentMethodId = (sale.transactions && sale.transactions.length > 0)
            ? sale.transactions[0].payment_method_id
            : 1; // Default to cash

        saleRepository.insertTransaction({
            sale_id: saleId,
            amount: -totalRefund.toNumber(), // Negative amount for refund
            type: 'refund',
            payment_method_id: paymentMethodId,
            status: 'completed'
        });

        // Update sale paid amount
        const newPaidAmount = new Decimal(sale.paid_amount).sub(totalRefund);
        saleRepository.updateSalePaidAmount(saleId, newPaidAmount.toNumber());

        // Update sale status if fully refunded
        if (newPaidAmount.lte(0) && sale.total_amount > 0) {
            saleRepository.updateSaleStatus(saleId, 'refunded');
        }

        // Log return creation
        auditService.logCreate(userId, 'returns', returnId, {
            sale_id: saleId,
            total_refund: totalRefund.toNumber(),
            item_count: processedItems.length,
            reason
        });

        return {
            id: returnId,
            saleId,
            totalRefund: totalRefund.toNumber(),
            itemCount: processedItems.length
        };
    });

    return tx.immediate();
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
