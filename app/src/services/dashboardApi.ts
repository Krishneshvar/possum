import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../lib/api-client';

export const dashboardApi = createApi({
    reducerPath: 'dashboardApi',
    baseQuery,
    endpoints: (builder) => ({
        getDailyStats: builder.query({
            query: (date: string) => `/reports/daily?date=${date}`,
        }),
        getTopProducts: builder.query({
            query: ({ startDate, endDate, limit = 5 }: { startDate: string; endDate: string; limit?: number }) => 
                `/reports/top-products?startDate=${startDate}&endDate=${endDate}&limit=${limit}`,
        }),
        getLowStockItems: builder.query({
            query: () => '/inventory/alerts/low-stock',
        }),
    }),
});

export const { 
    useGetDailyStatsQuery, 
    useGetTopProductsQuery,
    useGetLowStockItemsQuery 
} = dashboardApi;
