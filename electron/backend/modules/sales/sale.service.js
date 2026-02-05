/**
 * Sale Service
 * Contains business logic for sales operations
 */
import * as saleRepository from './sale.repository.js';
import * as inventoryRepository from '../inventory/inventory.repository.js';
import * as productFlowRepository from '../productFlow/productFlow.repository.js';
import * as productRepository from '../products/product.repository.js';
import * as auditService from '../audit/audit.service.js';
import { findVariantById } from '../variants/variant.repository.js';
import { transaction } from '../../shared/db/index.js';
import { getComputedStock } from '../../shared/utils/inventoryHelpers.js';

/**
 * Create a new sale with all related records
 * @param {Object} params - Sale parameters
 * @returns {Object} Created sale
 */
export function createSale({
    items,
    customerId,
    userId,
    discount = 0,
    payments = []
}) {
    return transaction(() => {
        // Validate stock availability for all items
        for (const item of items) {
            const currentStock = getComputedStock(item.variantId);
            if (currentStock < item.quantity) {
                const variant = findVariantById(item.variantId);
                throw new Error(`Insufficient stock for ${variant?.name || 'variant'}. Available: ${currentStock}, Requested: ${item.quantity}`);
            }
        }

        // Calculate totals with frozen pricing
        let totalAmount = 0;
        let totalTax = 0;
        const processedItems = [];

        for (const item of items) {
            const variant = findVariantById(item.variantId);
            if (!variant) {
                throw new Error(`Variant not found: ${item.variantId}`);
            }

            // Get taxes for the product
            const taxes = productRepository.findProductTaxes(variant.product_id);

            const inclusiveTaxRate = taxes
                .filter(t => t.type === 'inclusive')
                .reduce((sum, t) => sum + t.rate, 0) / 100;

            const exclusiveTaxRate = taxes
                .filter(t => t.type === 'exclusive')
                .reduce((sum, t) => sum + t.rate, 0) / 100;

            const pricePerUnit = item.pricePerUnit ?? variant.mrp;
            const costPerUnit = variant.cost_price;
            const quantity = item.quantity;
            const itemDiscount = item.discount ?? 0;

            const subtotal = pricePerUnit * quantity - itemDiscount;

            const baseAmount = subtotal / (1 + inclusiveTaxRate);
            const itemTaxAmount = (subtotal - baseAmount) + (baseAmount * exclusiveTaxRate);

            totalAmount += baseAmount + itemTaxAmount;
            totalTax += itemTaxAmount;

            processedItems.push({
                variant_id: item.variantId,
                quantity,
                price_per_unit: pricePerUnit,
                cost_per_unit: costPerUnit,
                tax_rate: (inclusiveTaxRate + exclusiveTaxRate) * 100, // Storing combined rate for simplicity
                tax_amount: itemTaxAmount,
                discount_amount: itemDiscount
            });
        }

        // Apply overall discount
        totalAmount = totalAmount - discount;

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
        auditService.logCreate(userId, 'sales', saleId, {
            invoice_number: invoiceNumber,
            total_amount: totalAmount,
            paid_amount: paidAmount,
            discount,
            status,
            customer_id: customerId,
            items_count: processedItems.length
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
export function addPayment({ saleId, amount, paymentMethodId, userId }) {
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
        auditService.logUpdate(userId, 'sales', saleId,
            { paid_amount: sale.paid_amount, status: sale.status },
            { paid_amount: newPaidAmount, status: newStatus }
        );

        return { newPaidAmount, status: newStatus };
    });
}

/**
 * Cancel a sale
 * @param {number} saleId - Sale ID
 * @param {number} userId - User performing cancellation
 * @returns {Object} Cancellation result
 */
export function cancelSale(saleId, userId) {
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
        auditService.logUpdate(userId, 'sales', saleId,
            { status: sale.status },
            { status: 'cancelled' }
        );

        return { success: true, message: 'Sale cancelled successfully' };
    });
}

/**
 * Get payment methods
 * @returns {Array} Active payment methods
 */
export function getPaymentMethods() {
    return saleRepository.findPaymentMethods();
}
