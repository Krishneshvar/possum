/**
 * Return Service
 * Contains business logic for returns
 */
import { Decimal } from 'decimal.js';
import * as returnRepository from './return.repository.js';
import * as saleRepository from '../sales/sale.repository.js';
import * as saleService from '../sales/sale.service.js';
import * as inventoryService from '../inventory/inventory.service.js';
import * as auditService from '../audit/audit.service.js';
import { transaction } from '../../shared/db/index.js';
import { calculateRefunds, calculateTotalRefund } from './return.calculator.js';
import type { ReturnFilters } from './return.repository.js';
import type { SaleItem } from '../../../../types/index.js';

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
        // Validate inputs
        if (!Number.isInteger(saleId) || saleId <= 0) {
            throw new Error('Invalid sale ID');
        }
        if (!Number.isInteger(userId) || userId <= 0) {
            throw new Error('Invalid user ID');
        }
        if (typeof reason !== 'string' || reason.trim().length === 0) {
            throw new Error('Return reason is required');
        }
        if (!Array.isArray(items) || items.length === 0) {
            throw new Error('At least one return item is required');
        }

        // Validate sale exists
        const sale = saleRepository.findSaleById(saleId);
        if (!sale) {
            throw new Error('Sale not found');
        }

        // Aggregate duplicate saleItemIds to prevent over-return
        const aggregatedItems = new Map<number, number>();
        for (const item of items) {
            if (!Number.isInteger(item.saleItemId) || item.saleItemId <= 0) {
                throw new Error(`Invalid sale item ID: ${item.saleItemId}`);
            }
            if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
                throw new Error(`Invalid return quantity for item ${item.saleItemId}`);
            }
            aggregatedItems.set(
                item.saleItemId,
                (aggregatedItems.get(item.saleItemId) ?? 0) + item.quantity
            );
        }

        // Validate return quantities and prepare items
        const returnItems = [];
        for (const [saleItemId, requestedQuantity] of aggregatedItems.entries()) {
            const saleItem = sale.items.find((si: SaleItem) => si.id === saleItemId);
            if (!saleItem) {
                throw new Error(`Sale item ${saleItemId} not found in sale`);
            }

            const alreadyReturned = returnRepository.getTotalReturnedQuantity(saleItemId);
            const availableToReturn = saleItem.quantity - alreadyReturned;

            if (requestedQuantity > availableToReturn) {
                throw new Error(
                    `Cannot return ${requestedQuantity} of ${saleItem.variant_name}. ` +
                    `Only ${availableToReturn} remaining to return.`
                );
            }

            returnItems.push({
                saleItemId,
                quantity: requestedQuantity,
                variantId: saleItem.variant_id
            });
        }

        // Calculate refund amounts using calculator
        const refundCalculations = calculateRefunds(
            returnItems,
            sale.items,
            sale.discount
        );
        const totalRefund = calculateTotalRefund(refundCalculations);

        // Validate refund amount
        if (totalRefund > sale.paid_amount) {
            throw new Error(
                `Cannot refund ${totalRefund.toFixed(2)}. Maximum refundable amount is ${new Decimal(sale.paid_amount).toFixed(2)}.`
            );
        }

        // Create return record
        const returnResult = returnRepository.insertReturn({
            sale_id: saleId,
            user_id: userId,
            reason: reason.trim()
        });
        const returnId = Number(returnResult.lastInsertRowid);

        // Create return items and restore inventory
        for (const refundItem of refundCalculations) {
            const returnItemResult = returnRepository.insertReturnItem({
                return_id: returnId,
                sale_item_id: refundItem.saleItemId,
                quantity: refundItem.quantity,
                refund_amount: refundItem.refundAmount
            });
            const returnItemId = Number(returnItemResult.lastInsertRowid);

            // Restore inventory
            inventoryService.restoreStock({
                variantId: refundItem.variantId,
                referenceType: 'sale_item',
                referenceId: refundItem.saleItemId,
                quantity: refundItem.quantity,
                userId,
                reason: 'return',
                newReferenceType: 'return_item',
                newReferenceId: returnItemId
            });
        }

        // Process sale refund (transaction, paid amount, status)
        saleService.processSaleRefund({
            saleId,
            refundAmount: totalRefund,
            userId
        });

        // Log return creation
        auditService.logCreate(userId, 'returns', returnId, {
            sale_id: saleId,
            total_refund: totalRefund,
            item_count: refundCalculations.length,
            reason
        });

        return {
            id: returnId,
            saleId,
            totalRefund,
            itemCount: refundCalculations.length
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
    if (!Number.isInteger(saleId) || saleId <= 0) {
        throw new Error('Invalid sale ID');
    }
    return returnRepository.findReturnsBySaleId(saleId);
}

/**
 * Get returns list
 * @param {Object} params - Query params
 * @returns {Object} Returns with pagination
 */
export function getReturns(params: ReturnFilters) {
    const currentPage = Number.isInteger(params.currentPage) && params.currentPage! > 0 ? params.currentPage : 1;
    const itemsPerPage = Number.isInteger(params.itemsPerPage) && params.itemsPerPage! > 0
        ? Math.min(params.itemsPerPage!, 100)
        : 20;

    return returnRepository.findReturns({
        ...params,
        currentPage,
        itemsPerPage
    });
}
