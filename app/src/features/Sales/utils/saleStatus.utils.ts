/**
 * Sale Status Utilities
 * Centralized business logic for sale status calculations and display
 */

export type SaleStatus = 'draft' | 'paid' | 'partially_paid' | 'cancelled' | 'refunded' | 'completed' | 'pending';
export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success';

export function getStatusBadgeVariant(status: string): BadgeVariant {
    switch (status) {
        case 'completed':
        case 'paid':
            return 'success';
        case 'pending':
        case 'partially_paid':
            return 'secondary';
        case 'cancelled':
            return 'destructive';
        case 'refunded':
            return 'outline';
        default:
            return 'secondary';
    }
}

export function getPaymentStatus(paidAmount: number, totalAmount: number): 'paid' | 'partial' | 'unpaid' {
    if (paidAmount >= totalAmount) return 'paid';
    if (paidAmount > 0) return 'partial';
    return 'unpaid';
}

export function getPaymentStatusBadgeVariant(paidAmount: number, totalAmount: number): BadgeVariant {
    const status = getPaymentStatus(paidAmount, totalAmount);
    switch (status) {
        case 'paid': return 'success';
        case 'partial': return 'secondary';
        case 'unpaid': return 'destructive';
    }
}

export function getPaymentStatusLabel(paidAmount: number, totalAmount: number): string {
    const status = getPaymentStatus(paidAmount, totalAmount);
    switch (status) {
        case 'paid': return 'Paid';
        case 'partial': return 'Partial';
        case 'unpaid': return 'Unpaid';
    }
}
