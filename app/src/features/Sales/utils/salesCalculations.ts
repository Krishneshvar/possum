/**
 * Sales Calculation Utilities
 * Centralized business logic for cart calculations
 */

export interface CartItem {
    pricePerUnit: number;
    quantity: number;
    discountType: 'amount' | 'percentage';
    discountValue: number;
}

export function calculateItemSubtotal(item: CartItem): number {
    return item.pricePerUnit * item.quantity;
}

export function calculateItemDiscountAmount(item: CartItem): number {
    const lineSubtotal = calculateItemSubtotal(item);
    if (item.discountType === 'percentage') {
        const pct = Math.max(0, Math.min(100, item.discountValue || 0));
        return (lineSubtotal * pct) / 100;
    }
    return Math.max(0, Math.min(lineSubtotal, item.discountValue || 0));
}

export function calculateItemTotal(item: CartItem): number {
    return Math.max(0, calculateItemSubtotal(item) - calculateItemDiscountAmount(item));
}

export function calculateCartSubtotal(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
}

export function calculateOverallDiscount(
    subtotal: number,
    discountType: 'fixed' | 'percentage',
    discountValue: number
): number {
    if (discountType === 'fixed') {
        return parseFloat(String(discountValue || 0));
    }
    return (subtotal * (parseFloat(String(discountValue || 0)) / 100));
}
