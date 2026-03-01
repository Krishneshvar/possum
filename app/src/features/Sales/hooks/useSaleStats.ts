/**
 * useSaleStats Hook
 * Encapsulates business logic for calculating sale statistics
 */
import { useMemo } from 'react';
import { Sale } from '../../../../../models/index.js';

interface SaleStats {
    totalBills: number;
    paid: number;
    partialOrDraft: number;
    cancelledOrRefunded: number;
    totalRevenue: number;
}

export function useSaleStats(sales: Sale[], totalRecords?: number): SaleStats {
    return useMemo(() => {
        const paid = sales.filter(s => s.status === 'paid').length;
        const partialOrDraft = sales.filter(s => s.status === 'partially_paid' || s.status === 'draft').length;
        const cancelled = sales.filter(s => s.status === 'cancelled').length;
        const refunded = sales.filter(s => s.status === 'refunded').length;
        const totalRevenue = sales.reduce((sum, s) => {
            if (s.status !== 'cancelled') {
                return sum + (s.paid_amount || 0);
            }
            return sum;
        }, 0);

        return {
            totalBills: totalRecords || sales.length,
            paid,
            partialOrDraft,
            cancelledOrRefunded: cancelled + refunded,
            totalRevenue,
        };
    }, [sales, totalRecords]);
}
