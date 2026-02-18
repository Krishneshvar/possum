/**
 * Sale Service
 * Contains business logic for sales operations
 */
import { Decimal } from 'decimal.js';
import * as saleRepository from './sale.repository.js';
import * as inventoryRepository from '../inventory/inventory.repository.js';
import * as inventoryService from '../inventory/inventory.service.js';
import * as productFlowRepository from '../productFlow/productFlow.repository.js';
import * as productRepository from '../products/product.repository.js';
import * as auditService from '../audit/audit.service.js';
import * as customerRepository from '../customers/customer.repository.js';
import { taxEngine } from '../taxes/tax.engine.js';
import { findVariantById } from '../variants/variant.repository.js';
import { transaction } from '../../shared/db/index.js';
import { getComputedStock, getComputedStockBatch } from '../../shared/utils/inventoryHelpers.js';
import * as AuthService from '../auth/auth.service.js';
import { Invoice, InvoiceItem, Variant, Customer, Sale, SaleItem, INVENTORY_REASONS } from '../../../../types/index.js';

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
    taxMode = 'item', // Deprecated but kept for signature
    billTaxIds = [], // Deprecated
    fulfillment_status = 'pending',
    token // Added token for permission check
}: CreateSaleParams): Promise<Sale> {
    if (!token) {
        throw new Error('Unauthorized: Service requires token for permission check');
    }

    const session = AuthService.getSession(token);
    if (!session) throw new Error('Unauthorized: Invalid session');

    const userPermissions = session.permissions || [];
    if (!userPermissions.includes('sales.create')) {
        throw new Error('Forbidden: Missing required permission sales.create');
    }

    // Pre-fetch stock and variant data asynchronously (Parallel & Non-blocking)
    const variantIds = items.map(item => item.variantId);
    const stockMapPromise = getComputedStockBatch(variantIds);
    const variantPromises = variantIds.map(id => findVariantById(id));

    const [stockMap, variantsList] = await Promise.all([
        stockMapPromise,
        Promise.all(variantPromises)
    ]);

    const preFetchedVariantMap = new Map<number, Variant>();
    variantsList.forEach(v => {
        if (v) preFetchedVariantMap.set(v.id!, v);
    });

    // Validate stock and existence before transaction
    for (const item of items) {
        const variant = preFetchedVariantMap.get(item.variantId);
        if (!variant) throw new Error(`Variant not found: ${item.variantId}`);

        const currentStock = stockMap[item.variantId] ?? 0;
        if (currentStock < item.quantity) {
            throw new Error(`Insufficient stock for ${variant.name}. Available: ${currentStock}, Requested: ${item.quantity}`);
        }
    }

    const saleId = transaction(() => {
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
            const product = productRepository.findProductById(variant.product_id);

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
            const found = customerRepository.findCustomerById(customerId);
            if (found) customer = found;
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

        // Determine status
        let statusIdx: 'draft' | 'paid' | 'partially_paid' = 'draft';
        if (paidAmount.gte(totalAmount)) {
            statusIdx = 'paid';
        } else if (paidAmount.gt(0)) {
            statusIdx = 'partially_paid';
        }

        // Generate invoice number
        const invoiceNumber = saleRepository.generateInvoiceNumber();

        // Insert sale
        const saleResult = saleRepository.insertSale({
            invoice_number: invoiceNumber,
            total_amount: totalAmount.toNumber(),
            paid_amount: paidAmount.toNumber(),
            discount,
            total_tax: totalTax.toNumber(),
            status: statusIdx,
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
        (auditService as any).logAction(
            userId,
            'sales.create',
            'SALE',
            newSaleId,
            null, // oldData
            null, // newData
            {
                invoice_number: invoiceNumber,
                total_amount: totalAmount.toNumber(),
                items_count: processedItems.length
            }
        );

        return newSaleId;
    })();

    // Fetch created sale to return (outside of transaction)
    const createdSale = saleRepository.findSaleById(saleId);
    if (!createdSale) throw new Error('Failed to retrieve created sale');
    return createdSale;
}

/**
 * Get a sale by ID
 */
export function getSale(id: number): Sale | null {
    return saleRepository.findSaleById(id);
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
    if (!token) {
        throw new Error('Unauthorized: Service requires token for permission check');
    }

    const session = AuthService.getSession(token);
    if (!session) throw new Error('Unauthorized: Invalid session');

    const userPermissions = session.permissions || [];
    if (!userPermissions.includes('sales.create')) {
        throw new Error('Forbidden: Missing required permission sales.create');
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
            amount: amount,
            type: 'payment',
            payment_method_id: paymentMethodId,
            status: 'completed'
        });

        // Update paid amount
        const newPaidAmount = new Decimal(sale.paid_amount).add(amount);
        saleRepository.updateSalePaidAmount(saleId, newPaidAmount.toNumber());

        // Update status if fully paid
        let newStatus = sale.status;
        if (newPaidAmount.gte(sale.total_amount) && sale.status !== 'paid') {
            saleRepository.updateSaleStatus(saleId, 'paid');
            newStatus = 'paid';
        }

        // Log payment addition
        (auditService as any).logAction(
            userId,
            'ADD_PAYMENT',
            'SALE',
            saleId,
            null,
            null,
            { amount, new_status: newStatus }
        );

        return { newPaidAmount: newPaidAmount.toNumber(), status: newStatus };
    })();
}

/**
 * Cancel a sale
 */
export function cancelSale(saleId: number, userId: number, token?: string): { success: boolean, message: string } {
    if (!token) {
        throw new Error('Unauthorized: Service requires token for permission check');
    }

    const session = AuthService.getSession(token);
    if (!session || !(session.permissions || []).includes('sales.refund')) {
        throw new Error('Forbidden: Missing required permission sales.refund');
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
        (auditService as any).logAction(
            userId,
            'sales.refund',
            'SALE',
            saleId,
            null,
            null,
            { reason: 'Cancellation' }
        );

        return { success: true, message: 'Sale cancelled successfully' };
    })();
}

/**
 * Fulfill a sale/order
 */
export function fulfillSale(saleId: number, userId: number, token?: string): { success: boolean, message: string } {
    if (!token) {
        throw new Error('Unauthorized: Service requires token for permission check');
    }

    const session = AuthService.getSession(token);
    if (!session || !(session.permissions || []).includes('sales.create')) {
        throw new Error('Forbidden: Missing required permission sales.create');
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
        (auditService as any).logAction(
            userId,
            'sales.create',
            'SALE',
            saleId,
            null,
            null,
            null
        );

        return { success: true, message: 'Sale fulfilled successfully' };
    })();
}

/**
 * Get payment methods
 */
export function getPaymentMethods(): any[] {
    return saleRepository.findPaymentMethods();
}
