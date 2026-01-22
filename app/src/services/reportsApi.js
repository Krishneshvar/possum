import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@/lib/api-client';

export const reportsApi = createApi({
    reducerPath: 'reportsApi',
    baseQuery,
    tagTypes: ['Report'],
    endpoints: (builder) => ({
        // Get daily report
        getDailyReport: builder.query({
            query: (date) => `/reports/daily?date=${date}`,
            providesTags: (result, error, date) => [{ type: 'Report', id: `daily-${date}` }],
        }),

        // Get monthly report
        getMonthlyReport: builder.query({
            query: ({ year, month }) => `/reports/monthly?year=${year}&month=${month}`,
            providesTags: (result, error, { year, month }) => [{ type: 'Report', id: `monthly-${year}-${month}` }],
        }),

        // Get yearly report
        getYearlyReport: builder.query({
            query: (year) => `/reports/yearly?year=${year}`,
            providesTags: (result, error, year) => [{ type: 'Report', id: `yearly-${year}` }],
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
