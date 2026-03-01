import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../lib/api-client';

export const reportsApi = createApi({
    reducerPath: 'reportsApi',
    baseQuery,
    tagTypes: ['Report'],
    endpoints: (builder) => ({
        // Get daily report
        getDailyReport: builder.query({
            query: ({ startDate, endDate }) => `/reports/daily?startDate=${startDate}&endDate=${endDate}`,
            providesTags: (_result, _error, { startDate, endDate }) => [{ type: 'Report' as const, id: `daily-${startDate}-${endDate}` }],
        }),

        // Get monthly report
        getMonthlyReport: builder.query({
            query: ({ startDate, endDate }) => `/reports/monthly?startDate=${startDate}&endDate=${endDate}`,
            providesTags: (_result, _error, { startDate, endDate }) => [{ type: 'Report' as const, id: `monthly-${startDate}-${endDate}` }],
        }),

        // Get yearly report
        getYearlyReport: builder.query({
            query: ({ startDate, endDate }) => `/reports/yearly?startDate=${startDate}&endDate=${endDate}`,
            providesTags: (_result, _error, { startDate, endDate }) => [{ type: 'Report' as const, id: `yearly-${startDate}-${endDate}` }],
        }),

        // Get top products
        getTopProducts: builder.query({
            query: ({ startDate, endDate, limit = 10 }) =>
                `/reports/top-products?startDate=${startDate}&endDate=${endDate}&limit=${limit}`,
            providesTags: ['Report'],
        }),

        // Get sales by payment method
        getSalesByPaymentMethod: builder.query({
            query: ({ startDate, endDate }) =>
                `/reports/payment-methods?startDate=${startDate}&endDate=${endDate}`,
            providesTags: ['Report'],
        }),
    }),
});

export const {
    useGetDailyReportQuery,
    useGetMonthlyReportQuery,
    useGetYearlyReportQuery,
    useGetTopProductsQuery,
    useGetSalesByPaymentMethodQuery,
} = reportsApi;
