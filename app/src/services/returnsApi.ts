import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../lib/api-client';

export const returnsApi = createApi({
    reducerPath: 'returnsApi',
    baseQuery,
    tagTypes: ['Return', 'Sale', 'Inventory'],
    endpoints: (builder) => ({
        // Create a new return
        createReturn: builder.mutation({
            query: (newReturn) => ({
                url: '/returns',
                method: 'POST',
                body: newReturn,
            }),
            invalidatesTags: (result, error, { saleId }) => [
                { type: 'Sale', id: saleId },
                { type: 'Sale', id: 'LIST' },
                'Inventory'
            ],
        }),

        // Get returns list
        getReturns: builder.query({
            query: (params) => ({
                url: '/returns',
                params,
            }),
            providesTags: ['Return'],
        }),

        // Get return details
        getReturn: builder.query({
            query: (id) => `/returns/${id}`,
            providesTags: (result, error, id) => [{ type: 'Return', id }],
        }),

        // Get returns for a sale
        getSaleReturns: builder.query({
            query: (saleId) => `/returns/sale/${saleId}`,
            providesTags: (result, error, saleId) => [{ type: 'Return', id: `SALE-${saleId}` }],
        }),
    }),
});

export const {
    useCreateReturnMutation,
    useGetReturnsQuery,
    useGetReturnQuery,
    useGetSaleReturnsQuery,
} = returnsApi;
