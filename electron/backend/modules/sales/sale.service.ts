/**
 * Sale Service
 * Contains business logic for sales operations
 */
import { Decimal } from 'decimal.js';
import * as saleRepository from './sale.repository.js';
import * as inventoryService from '../inventory/inventory.service.js';
import * as auditService from '../audit/audit.service.js';
import { taxEngine } from '../taxes/tax.engine.js';
import { transaction } from '../../shared/db/index.js';
import { Invoice, InvoiceItem, Variant, Customer, Sale, SaleItem, INVENTORY_REASONS } from '../../../../types/index.js';
import { 
    fetchVariantsBatch, 
    fetchProductById, 
    fetchCustomerById,
    validatePaymentMethod,
    getVariantStock
} from './sale.dependencies.js';
import { generateInvoiceNumber } from './sale.utils.js';

interface CreateSaleParams {
    items: { variantId: number; quantity: number; discount?: number; pricePerUnit?: number }[];
    customerId?: number;
    userId: number;
    discount?: number;
    payments?: { amount: number; paymentMethodId: number }[];
    taxMode?: string;
    billTaxIds?: number[];
    fulfillment_status?: 'pending' | 'fulfilled' | 'cancelled';
    token?: string;
}

/**
 * Create a new sale with all related records
 */
export async function createSale({
    items,
    customerId,
    userId,
    discount = 0,
    payments = [],
    taxMode = 'item',
    billTaxIds = [],
    fulfillment_status = 'pending',
    token
}: CreateSaleParams): Promise<Sale> {

    if (discount < 0) {
        throw new Error('Discount cannot be negative');
    }

    if (payments.length > 0) {
        for (const payment of payments) {
            if (payment.amount <= 0) {
                throw new Error('Payment amount must be positive');
            }
            if (!validatePaymentMethod(payment.paymentMethodId)) {
                throw new Error(`Invalid payment method: ${payment.paymentMethodId}`);
            }
        }
    }

    const variantIds = items.map(item => item.variantId);
    const preFetchedVariantMap = await fetchVariantsBatch(variantIds);

    const saleId = transaction(() => {
        // LOCKING & VALIDATION: Move stock check INSIDE transaction to prevent race conditions.
        for (const item of items) {
            const variant = preFetchedVariantMap.get(item.variantId);
            if (!variant) throw new Error(`Variant not found: ${item.variantId}`);

            const currentStock = getVariantStock(item.variantId);
            if (currentStock < item.quantity) {
                const error = new Error(`Insufficient stock for ${variant.name}. Available: ${currentStock}, Requested: ${item.quantity}`);
                (error as any).code = 'INSUFFICIENT_STOCK';
                throw error;
            }
        }
        // Initialize Tax Engine
        taxEngine.init();

        // 1. Calculate Gross Total (Pre-Discount)
        let grossTotal = new Decimal(0);
        const tempItems: any[] = [];

        for (const item of items) {
            const variant = preFetchedVariantMap.get(item.variantId)!;
            const pricePerUnit = new Decimal(item.pricePerUnit ?? variant.price);
            const lineTotal = pricePerUnit.mul(item.quantity);
            const lineDiscount = new Decimal(item.discount ?? 0);
            const netLineTotal = Decimal.max(0, lineTotal.sub(lineDiscount));

            grossTotal = grossTotal.add(netLineTotal);
            tempItems.push({ ...item, pricePerUnit: pricePerUnit.toNumber(), netLineTotal });
        }

        // 2. Distribute Global Discount and Prepare Items for Tax Engine
        let distributedGlobalDiscount = new Decimal(0);
        const globalDiscountToDistribute = new Decimal(discount);
        const calculationItems: InvoiceItem[] = [];

        for (let i = 0; i < tempItems.length; i++) {
            const item = tempItems[i];
            const variant = preFetchedVariantMap.get(item.variantId)!;
            const product = fetchProductById(variant.product_id);

            let itemGlobalDiscount = new Decimal(0);
            if (grossTotal.gt(0) && globalDiscountToDistribute.gt(0)) {
                if (i === tempItems.length - 1) {
                    itemGlobalDiscount = globalDiscountToDistribute.sub(distributedGlobalDiscount);
                } else {
                    itemGlobalDiscount = item.netLineTotal.div(grossTotal).mul(globalDiscountToDistribute);
                    distributedGlobalDiscount = distributedGlobalDiscount.add(itemGlobalDiscount);
                }
            }

            const finalTaxableAmount = Decimal.max(0, item.netLineTotal.sub(itemGlobalDiscount));
            const effectiveUnitPrice = item.quantity > 0 ? finalTaxableAmount.div(item.quantity).toNumber() : 0;

            calculationItems.push({
                product_name: product?.name || 'Unknown',
                variant_name: variant.name,
                price: effectiveUnitPrice,
                quantity: item.quantity,
                tax_category_id: product?.tax_category_id,
                variant_id: item.variantId,
                product_id: variant.product_id,
                invoice_id: 0,
                tax_amount: 0,
                total: 0
            } as InvoiceItem);
        }

        let customer: Customer | null = null;
        if (customerId) {
            customer = fetchCustomerById(customerId);
        }

        // 3. Calculate Taxes on Discounted Amounts
        const taxResult = taxEngine.calculate({ items: calculationItems } as Invoice, customer);

        // 4. Process results
        let totalTax = new Decimal(taxResult.total_tax);
        const processedItems: Partial<SaleItem>[] = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const calculatedItem = taxResult.items[i];
            const variant = preFetchedVariantMap.get(item.variantId)!;

            const pricePerUnit = item.pricePerUnit ?? variant.price;
            const costPerUnit = variant.cost_price || 0;
            const itemDiscount = item.discount ?? 0;

            processedItems.push({
                variant_id: item.variantId,
                quantity: item.quantity,
                price_per_unit: pricePerUnit,
                cost_per_unit: costPerUnit,
                tax_rate: calculatedItem.tax_rate,
                tax_amount: calculatedItem.tax_amount,
                applied_tax_rate: calculatedItem.tax_rate,
                tax_rule_snapshot: calculatedItem.tax_rule_snapshot,
                discount_amount: itemDiscount
            });
        }

        // Grand Total from tax engine is the final payable amount.
        const totalAmount = new Decimal(taxResult.grand_total);

        // Calculate paid amount from payments
        const paidAmount = payments.reduce((sum, p) => sum.add(p.amount), new Decimal(0));

        // Determine status based on payment
        let status: 'draft' | 'paid' | 'partially_paid' = 'draft';
        if (paidAmount.gte(totalAmount)) {
            status = 'paid';
        } else if (paidAmount.gt(0)) {
            status = 'partially_paid';
        }

        const invoiceNumber = generateInvoiceNumber();

        // Insert sale
        const saleResult = saleRepository.insertSale({
            invoice_number: invoiceNumber,
            total_amount: totalAmount.toNumber(),
            paid_amount: paidAmount.toNumber(),
            discount,
            total_tax: totalTax.toNumber(),
            status,
            fulfillment_status,
            customer_id: customerId,
            user_id: userId
        });
        const newSaleId = Number(saleResult.lastInsertRowid);

        // Insert sale items and adjust inventory using FIFO
        for (const item of processedItems) {
            const itemResult = saleRepository.insertSaleItem({
                sale_id: newSaleId,
                ...item
            });
            const saleItemId = Number(itemResult.lastInsertRowid);

            // Deduct from inventory using FIFO lots
            inventoryService.deductStock({
                variantId: item.variant_id!,
                quantity: item.quantity || 0,
                userId,
                reason: INVENTORY_REASONS.SALE,
                referenceType: 'sale_item',
                referenceId: saleItemId
            });
        }

        // Insert payment transactions
        for (const payment of payments) {
            saleRepository.insertTransaction({
                sale_id: newSaleId,
                amount: payment.amount,
                type: 'payment',
                payment_method_id: payment.paymentMethodId,
                status: 'completed'
            });
        }

        // Log sale creation
        auditService.logCreate(
            userId,
            'sales',
            newSaleId,
            {
                invoice_number: invoiceNumber,
                total_amount: totalAmount.toNumber(),
                items_count: processedItems.length
            }
        );

        return newSaleId;
    }).immediate();

    // Fetch created sale to return (outside of transaction)
    const createdSale = saleRepository.findSaleById(saleId);
    if (!createdSale) throw new Error('Failed to retrieve created sale');
    return createdSale;
}

/**
 * Get a sale by ID
 */
export function getSale(id: number, userId?: number): Sale | null {
    const sale = saleRepository.findSaleById(id);
    
    // Log sale view for audit trail
    if (sale && userId) {
        auditService.logAction(userId, 'VIEW', 'sales', id, { invoice_number: sale.invoice_number });
    }
    
    return sale;
}

/**
 * Get sales list
 */
export function getSales(params: saleRepository.SaleFilter): saleRepository.PaginatedSales {
    return saleRepository.findSales(params);
}

/**
 * Add payment to an existing sale
 */
export function addPayment({ saleId, amount, paymentMethodId, userId, token }: { saleId: number; amount: number; paymentMethodId: number; userId: number; token?: string }): { newPaidAmount: number, status: string } {

    if (amount <= 0) {
        throw new Error('Payment amount must be positive');
    }

    if (!validatePaymentMethod(paymentMethodId)) {
        throw new Error(`Invalid payment method: ${paymentMethodId}`);
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

        if (sale.status === 'paid') {
            throw new Error('Sale is already fully paid');
        }

        // Insert transaction
        saleRepository.insertTransaction({
            sale_id: saleId,
            amount: amount,
            type: 'payment',
            payment_method_id: paymentMethodId,
            status: 'completed'
        });

        // Update paid amount
        const newPaidAmount = new Decimal(sale.paid_amount).add(amount);
        
        if (newPaidAmount.gt(sale.total_amount)) {
            throw new Error(`Payment amount exceeds remaining balance. Remaining: ${new Decimal(sale.total_amount).sub(sale.paid_amount).toFixed(2)}`);
        }
        
        saleRepository.updateSalePaidAmount(saleId, newPaidAmount.toNumber());

        // Update status if fully paid
        let newStatus = sale.status;
        if (newPaidAmount.gte(sale.total_amount)) {
            saleRepository.updateSaleStatus(saleId, 'paid');
            newStatus = 'paid';
        }

        // Get payment method name for logging
        const paymentMethods = saleRepository.findPaymentMethods();
        const paymentMethod = paymentMethods.find(pm => pm.id === paymentMethodId);

        // Log payment addition
        auditService.logCreate(
            userId,
            'transactions',
            0,
            { 
                sale_id: saleId, 
                amount, 
                payment_method: paymentMethod?.name || 'Unknown',
                new_status: newStatus 
            }
        );

        return { newPaidAmount: newPaidAmount.toNumber(), status: newStatus };
    }).immediate();
}

/**
 * Cancel a sale
 */
export function cancelSale(saleId: number, userId: number, token?: string): { success: boolean, message: string } {

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

        // Restore inventory for each item using lot-specific restoration
        for (const item of sale.items) {
            inventoryService.restoreStock({
                variantId: item.variant_id,
                referenceType: 'sale_item',
                referenceId: item.id,
                quantity: item.quantity,
                userId,
                reason: INVENTORY_REASONS.CORRECTION,
                newReferenceType: 'sale_cancellation',
                newReferenceId: saleId
            });
        }

        // Update sale status
        saleRepository.updateSaleStatus(saleId, 'cancelled');

        // Log sale cancellation
        auditService.logUpdate(
            userId,
            'sales',
            saleId,
            { status: sale.status },
            { status: 'cancelled' },
            { reason: 'Cancellation' }
        );

        return { success: true, message: 'Sale cancelled successfully' };
    }).immediate();
}

/**
 * Fulfill a sale/order
 */
export function fulfillSale(saleId: number, userId: number, token?: string): { success: boolean, message: string } {

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
        auditService.logUpdate(
            userId,
            'sales',
            saleId,
            { fulfillment_status: sale.fulfillment_status },
            { fulfillment_status: 'fulfilled' },
            null
        );

        return { success: true, message: 'Sale fulfilled successfully' };
    }).immediate();
}

/**
 * Get payment methods
 */
export function getPaymentMethods(): any[] {
    return saleRepository.findPaymentMethods();
}

/**
 * Process refund for a sale (called by Returns module)
 * Handles transaction creation, paid amount update, and status change
 */
export function processSaleRefund({
    saleId,
    refundAmount,
    userId
}: {
    saleId: number;
    refundAmount: number;
    userId: number;
}): { success: boolean } {
    if (refundAmount <= 0) {
        throw new Error('Refund amount must be positive');
    }

    return transaction(() => {
        const sale = saleRepository.findSaleById(saleId);
        if (!sale) {
            throw new Error('Sale not found');
        }

        if (new Decimal(refundAmount).gt(sale.paid_amount)) {
            throw new Error(
                `Cannot refund ${refundAmount}. Maximum refundable amount is ${sale.paid_amount}.`
            );
        }

        // Determine payment method for refund transaction
        const paymentTx = sale.transactions?.find(
            (t) => t.type === 'payment' && t.status === 'completed'
        );
        const activeMethods = saleRepository.findPaymentMethods();
        const fallbackPaymentMethodId = activeMethods.length > 0 ? activeMethods[0].id : 1;
        const paymentMethodId =
            paymentTx?.payment_method_id &&
            saleRepository.paymentMethodExists(paymentTx.payment_method_id)
                ? paymentTx.payment_method_id
                : fallbackPaymentMethodId;

        // Create refund transaction
        saleRepository.insertTransaction({
            sale_id: saleId,
            amount: -refundAmount,
            type: 'refund',
            payment_method_id: paymentMethodId,
            status: 'completed'
        });

        // Update sale paid amount
        const newPaidAmount = new Decimal(sale.paid_amount).sub(refundAmount);
        saleRepository.updateSalePaidAmount(saleId, newPaidAmount.toNumber());

        // Update sale status if fully refunded
        if (newPaidAmount.lte(0) && sale.total_amount > 0) {
            saleRepository.updateSaleStatus(saleId, 'refunded');
        }

        return { success: true };
    }).immediate();
}
