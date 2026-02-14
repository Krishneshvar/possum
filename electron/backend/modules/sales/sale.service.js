/**
 * Sale Service
 * Contains business logic for sales operations
 */
import * as saleRepository from './sale.repository.js';
import * as inventoryRepository from '../inventory/inventory.repository.js';
import * as productFlowRepository from '../productFlow/productFlow.repository.js';
import * as productRepository from '../products/product.repository.js';
import * as auditService from '../audit/audit.service.js';
import * as customerRepository from '../customers/customer.repository.js';
import { taxEngine } from '../taxes/tax.engine.js';
import { findVariantById } from '../variants/variant.repository.js';
import { transaction } from '../../shared/db/index.js';
import { getComputedStock } from '../../shared/utils/inventoryHelpers.js';
import * as AuthService from '../auth/auth.service.js';

/**
 * Create a new sale with all related records
 * @param {Object} params - Sale parameters
 * @returns {Object} Created sale
 */
export async function createSale({
    items,
    customerId,
    userId,
    discount = 0,
    payments = [],
    taxMode = 'item', // Deprecated but kept for signature
    billTaxIds = [], // Deprecated
    fulfillment_status = 'pending',
    token // Added token for permission check
}) {
    if (token) {
        AuthService.requirePermission(token, 'COMPLETE_SALE');
    } else {
        throw new Error('Unauthorized: Service requires token for permission check');
    }

    return transaction(() => {
        // ... (existing logic) ...
        // Validate stock availability for all items
        for (const item of items) {
            const currentStock = getComputedStock(item.variantId);
            if (currentStock < item.quantity) {
                const variant = findVariantById(item.variantId);
                throw new Error(`Insufficient stock for ${variant?.name || 'variant'}. Available: ${currentStock}, Requested: ${item.quantity}`);
            }
        }

        // Initialize Tax Engine
        taxEngine.init();

        // 1. Calculate Gross Total (Pre-Discount) to determine Discount Ratio if needed
        let grossTotal = 0;
        const tempItems = [];
        const variantMap = new Map();

        for (const item of items) {
            const variant = findVariantById(item.variantId);
            if (!variant) throw new Error(`Variant not found: ${item.variantId}`);
            variantMap.set(item.variantId, variant);

            const pricePerUnit = item.pricePerUnit ?? variant.mrp;
            const lineTotal = pricePerUnit * item.quantity;
            const lineDiscount = item.discount ?? 0;
            const netLineTotal = Math.max(0, lineTotal - lineDiscount);

            grossTotal += netLineTotal;
            tempItems.push({ ...item, pricePerUnit, netLineTotal });
        }

        // 2. Distribute Global Discount proportionally to items to get True Taxable Amount
        // Discount is applied to the Net Total (after line discounts)
        let distributedGlobalDiscount = 0;
        const calculationItems = [];

        for (let i = 0; i < tempItems.length; i++) {
            const item = tempItems[i];
            const variant = variantMap.get(item.variantId);
            const product = productRepository.findProductById(variant.product_id);

            let itemGlobalDiscount = 0;
            if (grossTotal > 0 && discount > 0) {
                // Last item gets the remainder to avoid rounding issues
                if (i === tempItems.length - 1) {
                    itemGlobalDiscount = discount - distributedGlobalDiscount;
                } else {
                    itemGlobalDiscount = (item.netLineTotal / grossTotal) * discount;
                    distributedGlobalDiscount += itemGlobalDiscount;
                }
            }

            // Final Taxable Amount for this line
            const finalTaxableAmount = Math.max(0, item.netLineTotal - itemGlobalDiscount);

            // Effective Unit Price for Tax Engine (Tax Engine expects unit price)
            // It calculates Total = Price * Qty
            // So Price = FinalTaxableAmount / Qty
            const effectiveUnitPrice = item.quantity > 0 ? finalTaxableAmount / item.quantity : 0;

            calculationItems.push({
                ...item,
                price: effectiveUnitPrice,
                quantity: item.quantity,
                tax_category_id: product.tax_category_id
            });
        }

        let customer = null;
        if (customerId) {
            customer = customerRepository.findCustomerById(customerId);
        }

        // 3. Calculate Taxes on Discounted Amounts
        const taxResult = taxEngine.calculate({ items: calculationItems }, customer);

        // 4. Process results
        let totalAmount = 0; // Final Payable
        let totalTax = taxResult.total_tax;
        const processedItems = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const calculatedItem = taxResult.items[i];
            const variant = variantMap.get(item.variantId);

            const pricePerUnit = item.pricePerUnit ?? variant.mrp;
            const costPerUnit = variant.cost_price;
            const itemDiscount = item.discount ?? 0;

            processedItems.push({
                variant_id: item.variantId,
                quantity: item.quantity,
                price_per_unit: pricePerUnit,
                cost_per_unit: costPerUnit,
                tax_rate: calculatedItem.applied_tax_rate,
                tax_amount: calculatedItem.tax_amount,
                applied_tax_rate: calculatedItem.applied_tax_rate,
                applied_tax_amount: calculatedItem.applied_tax_amount,
                tax_rule_snapshot: calculatedItem.tax_rule_snapshot,
                discount_amount: itemDiscount
            });
        }

        // Grand Total from tax engine is Sum(Item Total + Item Tax) (if Exclusive) or Sum(Item Total) (if Inclusive)
        // Since we fed it "Post-Global-Discount" prices, taxResult.grand_total IS the final payable amount.
        totalAmount = taxResult.grand_total;

        // Calculate paid amount from payments
        const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);

        // Determine status
        let status = 'draft';
        if (paidAmount >= totalAmount) {
            status = 'paid';
        } else if (paidAmount > 0) {
            status = 'partially_paid';
        }

        // Generate invoice number
        const invoiceNumber = saleRepository.generateInvoiceNumber();

        // Insert sale
        const saleResult = saleRepository.insertSale({
            invoice_number: invoiceNumber,
            total_amount: totalAmount,
            paid_amount: paidAmount,
            discount,
            total_tax: totalTax,
            status,
            fulfillment_status,
            customer_id: customerId,
            user_id: userId
        });
        const saleId = Number(saleResult.lastInsertRowid);

        // Insert sale items and adjust inventory
        for (const item of processedItems) {
            const itemResult = saleRepository.insertSaleItem({
                sale_id: saleId,
                ...item
            });
            const saleItemId = Number(itemResult.lastInsertRowid);

            // Deduct from inventory
            inventoryRepository.insertInventoryAdjustment({
                variant_id: item.variant_id,
                lot_id: null,
                quantity_change: -item.quantity,
                reason: 'sale',
                reference_type: 'sale_item',
                reference_id: saleItemId,
                adjusted_by: userId
            });

            // Log product flow
            productFlowRepository.insertProductFlow({
                variant_id: item.variant_id,
                event_type: 'sale',
                quantity: -item.quantity,
                reference_type: 'sale_item',
                reference_id: saleItemId
            });
        }

        // Insert payment transactions
        for (const payment of payments) {
            saleRepository.insertTransaction({
                sale_id: saleId,
                amount: payment.amount,
                type: 'payment',
                payment_method_id: payment.paymentMethodId,
                status: 'completed'
            });
        }

        // Log sale creation
        auditService.logAction({
            userId,
            action: 'COMPLETE_SALE',
            entity: 'SALE',
            entityId: saleId,
            metadata: {
                invoice_number: invoiceNumber,
                total_amount: totalAmount,
                items_count: processedItems.length
            }
        });

        return {
            id: saleId,
            invoiceNumber,
            totalAmount,
            totalTax,
            paidAmount,
            discount,
            status
        };
    });
}

/**
 * Get a sale by ID
 * @param {number} id - Sale ID
 * @returns {Object|null} Sale with details
 */
export function getSale(id) {
    return saleRepository.findSaleById(id);
}

/**
 * Get sales list
 * @param {Object} params - Filter params
 * @returns {Object} Sales with pagination
 */
export function getSales(params) {
    return saleRepository.findSales(params);
}

/**
 * Add payment to an existing sale
 * @param {Object} params - Payment params
 * @returns {Object} Updated sale info
 */
export function addPayment({ saleId, amount, paymentMethodId, userId, token }) {
    if (token) {
        AuthService.requirePermission(token, 'COMPLETE_SALE');
    } else {
        throw new Error('Unauthorized: Service requires token for permission check');
    }

    return transaction(() => {
        const sale = saleRepository.findSaleById(saleId);
        if (!sale) {
            throw new Error('Sale not found');
        }

        if (sale.status === 'cancelled') {
            throw new Error('Cannot add payment to cancelled sale');
        }

        if (sale.status === 'refunded') {
            throw new Error('Cannot add payment to refunded sale');
        }

        // Insert transaction
        saleRepository.insertTransaction({
            sale_id: saleId,
            amount,
            type: 'payment',
            payment_method_id: paymentMethodId,
            status: 'completed'
        });

        // Update paid amount
        const newPaidAmount = sale.paid_amount + amount;
        saleRepository.updateSalePaidAmount(saleId, newPaidAmount);

        // Update status if fully paid
        let newStatus = sale.status;
        if (newPaidAmount >= sale.total_amount && sale.status !== 'paid') {
            saleRepository.updateSaleStatus(saleId, 'paid');
            newStatus = 'paid';
        }

        // Log payment addition
        auditService.logAction({
            userId,
            action: 'ADD_PAYMENT',
            entity: 'SALE',
            entityId: saleId,
            metadata: { amount, new_status: newStatus }
        });

        return { newPaidAmount, status: newStatus };
    });
}

/**
 * Cancel a sale
 * @param {number} saleId - Sale ID
 * @param {number} userId - User performing cancellation
 * @param {string} token - Auth token
 * @returns {Object} Cancellation result
 */
export function cancelSale(saleId, userId, token) {
    if (token) {
        AuthService.requirePermission(token, 'VOID_INVOICE');
    } else {
        throw new Error('Unauthorized: Service requires token for permission check');
    }

    return transaction(() => {
        const sale = saleRepository.findSaleById(saleId);
        if (!sale) {
            throw new Error('Sale not found');
        }

        if (sale.status === 'cancelled') {
            throw new Error('Sale is already cancelled');
        }

        if (sale.status === 'refunded') {
            throw new Error('Cannot cancel a refunded sale');
        }

        // Restore inventory for each item
        for (const item of sale.items) {
            inventoryRepository.insertInventoryAdjustment({
                variant_id: item.variant_id,
                lot_id: null,
                quantity_change: item.quantity,
                reason: 'correction',
                reference_type: 'sale_cancellation',
                reference_id: saleId,
                adjusted_by: userId
            });

            // Log product flow
            productFlowRepository.insertProductFlow({
                variant_id: item.variant_id,
                event_type: 'adjustment',
                quantity: item.quantity,
                reference_type: 'sale_cancellation',
                reference_id: saleId
            });
        }

        // Update sale status
        saleRepository.updateSaleStatus(saleId, 'cancelled');

        // Log sale cancellation
        auditService.logAction({
            userId,
            action: 'VOID_INVOICE',
            entity: 'SALE',
            entityId: saleId,
            metadata: { reason: 'Cancellation' }
        });

        return { success: true, message: 'Sale cancelled successfully' };
    });
}

/**
 * Fulfill a sale/order
 * @param {number} saleId - Sale ID
 * @param {number} userId - User performing fulfillment
 * @returns {Object} Fulfillment result
 */
export function fulfillSale(saleId, userId, token) {
    if (token) {
        AuthService.requirePermission(token, 'COMPLETE_SALE');
    } else {
        throw new Error('Unauthorized: Service requires token for permission check');
    }

    return transaction(() => {
        const sale = saleRepository.findSaleById(saleId);
        if (!sale) {
            throw new Error('Sale not found');
        }

        if (sale.fulfillment_status === 'fulfilled') {
            throw new Error('Sale is already fulfilled');
        }

        if (sale.status === 'cancelled') {
            throw new Error('Cannot fulfill a cancelled sale');
        }

        // Update fulfillment status
        saleRepository.updateFulfillmentStatus(saleId, 'fulfilled');

        // Log fulfillment
        auditService.logAction({
            userId,
            action: 'FULFILL_SALE',
            entity: 'SALE',
            entityId: saleId
        });

        return { success: true, message: 'Sale fulfilled successfully' };
    });
}

/**
 * Get payment methods
 * @returns {Array} Active payment methods
 */
export function getPaymentMethods() {
    return saleRepository.findPaymentMethods();
}
