import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../lib/api-client';

export const reportsApi = createApi({
    reducerPath: 'reportsApi',
    baseQuery,
    tagTypes: ['Report'],
    endpoints: (builder) => ({
        // Get daily report
        getDailyReport: builder.query({
            query: ({ startDate, endDate, paymentMethod }) => {
                let url = `/reports/daily?startDate=${startDate}&endDate=${endDate}`;
                if (paymentMethod) url += `&paymentMethod=${paymentMethod}`;
                return url;
            },
            providesTags: (_result, _error, { startDate, endDate, paymentMethod }) => [
                { type: 'Report' as const, id: `daily-${startDate}-${endDate}-${paymentMethod || 'all'}` }
            ],
        }),

        // Get monthly report
        getMonthlyReport: builder.query({
            query: ({ startDate, endDate, paymentMethod }) => {
                let url = `/reports/monthly?startDate=${startDate}&endDate=${endDate}`;
                if (paymentMethod) url += `&paymentMethod=${paymentMethod}`;
                return url;
            },
            providesTags: (_result, _error, { startDate, endDate, paymentMethod }) => [
                { type: 'Report' as const, id: `monthly-${startDate}-${endDate}-${paymentMethod || 'all'}` }
            ],
        }),

        // Get yearly report
        getYearlyReport: builder.query({
            query: ({ startDate, endDate, paymentMethod }) => {
                let url = `/reports/yearly?startDate=${startDate}&endDate=${endDate}`;
                if (paymentMethod) url += `&paymentMethod=${paymentMethod}`;
                return url;
            },
            providesTags: (_result, _error, { startDate, endDate, paymentMethod }) => [
                { type: 'Report' as const, id: `yearly-${startDate}-${endDate}-${paymentMethod || 'all'}` }
            ],
        }),

        // Get top products
        getTopProducts: builder.query({
            query: ({ startDate, endDate, limit = 10, paymentMethod }) => {
                let url = `/reports/top-products?startDate=${startDate}&endDate=${endDate}&limit=${limit}`;
                if (paymentMethod) url += `&paymentMethod=${paymentMethod}`;
                return url;
            },
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
