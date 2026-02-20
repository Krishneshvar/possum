/**
 * useSaleStats Hook
 * Encapsulates business logic for calculating sale statistics
 */
import { useMemo } from 'react';
import { Sale } from '../../../../types/index.js';

interface SaleStats {
    totalBills: number;
    completed: number;
    pending: number;
    cancelledOrRefunded: number;
}

export function useSaleStats(sales: Sale[], totalRecords?: number): SaleStats {
    return useMemo(() => {
        const completed = sales.filter(s => s.status === 'completed').length;
        const pending = sales.filter(s => s.status === 'pending').length;
        const cancelled = sales.filter(s => s.status === 'cancelled').length;
        const refunded = sales.filter(s => s.status === 'refunded').length;

        return {
            totalBills: totalRecords || sales.length,
            completed,
            pending,
            cancelledOrRefunded: cancelled + refunded,
        };
    }, [sales, totalRecords]);
}
