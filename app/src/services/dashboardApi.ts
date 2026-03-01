import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../lib/api-client';

export const dashboardApi = createApi({
    reducerPath: 'dashboardApi',
    baseQuery,
    tagTypes: ['DailyStats', 'TopProducts', 'LowStock'],
    keepUnusedDataFor: 300,
    endpoints: (builder) => ({
        getDailyStats: builder.query({
            query: (date: string) => `/reports/daily?startDate=${date}&endDate=${date}`,
            providesTags: ['DailyStats'],
        }),
        getTopProducts: builder.query({
            query: ({ startDate, endDate, limit = 5 }: { startDate: string; endDate: string; limit?: number }) =>
                `/reports/top-products?startDate=${startDate}&endDate=${endDate}&limit=${limit}`,
            providesTags: ['TopProducts'],
        }),
        getLowStockItems: builder.query({
            query: () => '/inventory/alerts/low-stock',
            providesTags: ['LowStock'],
        }),
    }),
});

export const {
    useGetDailyStatsQuery,
    useGetTopProductsQuery,
    useGetLowStockItemsQuery
} = dashboardApi;
