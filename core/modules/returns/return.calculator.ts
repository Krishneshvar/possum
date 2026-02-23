/**
 * Return Calculator
 * Handles refund amount calculations with pro-rated discounts
 */
import { Decimal } from 'decimal.js';

interface SaleItem {
    id: number;
    price_per_unit: number;
    quantity: number;
    discount_amount: number;
    variant_id: number;
    [key: string]: any;
}

export interface RefundCalculationItem {
    saleItemId: number;
    quantity: number;
    variantId: number;
}

export interface RefundCalculationResult {
    saleItemId: number;
    quantity: number;
    refundAmount: number;
    variantId: number;
}

/**
 * Calculate refund amounts for returned items with pro-rated global discount
 */
export function calculateRefunds(
    returnItems: RefundCalculationItem[],
    saleItems: SaleItem[],
    saleGlobalDiscount: number
): RefundCalculationResult[] {
    // Calculate bill items subtotal (before global discount)
    let billItemsSubtotal = new Decimal(0);
    saleItems.forEach((si) => {
        const lineSubtotal = new Decimal(si.price_per_unit)
            .mul(si.quantity)
            .sub(si.discount_amount);
        billItemsSubtotal = billItemsSubtotal.add(lineSubtotal);
    });

    const globalDiscount = new Decimal(saleGlobalDiscount);
    const results: RefundCalculationResult[] = [];

    for (const returnItem of returnItems) {
        const saleItem = saleItems.find((si) => si.id === returnItem.saleItemId);
        if (!saleItem) {
            throw new Error(`Sale item ${returnItem.saleItemId} not found`);
        }

        // 1. Line subtotal (after line-level discount)
        const linePricePerUnit = new Decimal(saleItem.price_per_unit);
        const lineQuantity = new Decimal(saleItem.quantity);
        const lineDiscountAmount = new Decimal(saleItem.discount_amount);
        const lineSubtotal = linePricePerUnit.mul(lineQuantity).sub(lineDiscountAmount);

        // 2. Pro-rated global discount for this line
        const lineGlobalDiscount = billItemsSubtotal.gt(0)
            ? lineSubtotal.div(billItemsSubtotal).mul(globalDiscount)
            : new Decimal(0);

        // 3. Line net paid (after both discounts)
        const lineNetPaid = lineSubtotal.sub(lineGlobalDiscount);

        // 4. Refund for the returned quantity
        const refundAmount = lineNetPaid
            .div(lineQuantity)
            .mul(returnItem.quantity)
            .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

        results.push({
            saleItemId: returnItem.saleItemId,
            quantity: returnItem.quantity,
            refundAmount: refundAmount.toNumber(),
            variantId: returnItem.variantId
        });
    }

    return results;
}

/**
 * Calculate total refund amount
 */
export function calculateTotalRefund(refundItems: RefundCalculationResult[]): number {
    return refundItems.reduce(
        (sum, item) => sum.add(item.refundAmount),
        new Decimal(0)
    ).toNumber();
}
