import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@/lib/api-client';

export interface ReceiveInventoryParams {
    variantId: number;
    quantity: number;
    unitCost: number;
    batchNumber?: string;
    manufacturedDate?: string;
    expiryDate?: string;
    purchaseOrderItemId?: number;
}

export const inventoryApi = createApi({
    reducerPath: 'inventoryApi',
    baseQuery,
    tagTypes: ['Stock', 'Lot', 'Adjustment', 'LowStock', 'ExpiringLot'],
    endpoints: (builder) => ({
        // Get stock for a variant
        getVariantStock: builder.query({
            query: (variantId: number) => `/inventory/variants/${variantId}/stock`,
            providesTags: (result, error, variantId) => [{ type: 'Stock', id: variantId }],
        }),

        // Get inventory lots for a variant
        getVariantLots: builder.query({
            query: (variantId: number) => `/inventory/variants/${variantId}/lots`,
            providesTags: (result, error, variantId) => [{ type: 'Lot', id: variantId }],
        }),

        // Get inventory adjustments for a variant
        getVariantAdjustments: builder.query({
            query: ({ variantId, limit = 50, offset = 0 }: { variantId: number; limit?: number; offset?: number }) =>
                `/inventory/variants/${variantId}/adjustments?limit=${limit}&offset=${offset}`,
            providesTags: (result, error, { variantId }) => [{ type: 'Adjustment', id: variantId }],
        }),

        // Get low stock alerts
        getLowStockAlerts: builder.query({
            query: () => '/inventory/alerts/low-stock',
            providesTags: ['LowStock'],
        }),

        // Get expiring lots
        getExpiringLots: builder.query({
            query: (days: number = 30) => `/inventory/alerts/expiring?days=${days}`,
            providesTags: ['ExpiringLot'],
        }),

        // Get inventory stats
        getInventoryStats: builder.query({
            query: () => '/inventory/stats',
            providesTags: ['Stock'],
        }),

        // Create inventory adjustment
        createAdjustment: builder.mutation({
            query: (body) => ({
                url: '/inventory/adjustments',
                method: 'POST',
                body,
            }),
            invalidatesTags: (result, error, { variantId }) => [
                { type: 'Stock', id: variantId },
                { type: 'Adjustment', id: variantId },
                'Stock',
                'LowStock',
            ],
        }),

        // Receive inventory
        receiveInventory: builder.mutation({
            query: (body: ReceiveInventoryParams) => ({
                url: '/inventory/receive',
                method: 'POST',
                body,
            }),
            invalidatesTags: (result, error, { variantId }) => [
                { type: 'Stock', id: variantId },
                { type: 'Lot', id: variantId },
                'LowStock',
            ],
        }),
    }),
});

export const {
    useGetVariantStockQuery,
    useGetVariantLotsQuery,
    useGetVariantAdjustmentsQuery,
    useGetLowStockAlertsQuery,
    useGetExpiringLotsQuery,
    useGetInventoryStatsQuery,
    useCreateAdjustmentMutation,
    useReceiveInventoryMutation,
} = inventoryApi;
