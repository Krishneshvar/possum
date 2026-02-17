import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../lib/api-client';

export const salesApi = createApi({
    reducerPath: 'salesApi',
    baseQuery,
    tagTypes: ['Sale', 'PaymentMethod'],
    endpoints: (builder) => ({
        // Create a new sale
        createSale: builder.mutation({
            query: (newSale) => ({
                url: '/sales',
                method: 'POST',
                body: newSale,
            }),
            invalidatesTags: [{ type: 'Sale', id: 'LIST' }],
        }),

        // Get sales list with filters
        getSales: builder.query({
            query: (params) => ({
                url: '/sales',
                params: params,
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.sales.map(({ id }: { id: number }) => ({ type: 'Sale' as const, id })),
                        { type: 'Sale', id: 'LIST' },
                    ]
                    : [{ type: 'Sale', id: 'LIST' }],
        }),

        // Get single sale details
        getSale: builder.query({
            query: (id) => `/sales/${id}`,
            providesTags: (result, error, id) => [{ type: 'Sale', id }],
        }),

        // Add payment to an existing sale (for partial payments or pay-later)
        addPayment: builder.mutation({
            query: ({ saleId, amount, paymentMethodId }) => ({
                url: `/sales/${saleId}/payments`,
                method: 'POST',
                body: { amount, paymentMethodId },
            }),
            invalidatesTags: (result, error, { saleId }) => [
                { type: 'Sale', id: saleId },
                { type: 'Sale', id: 'LIST' },
            ],
        }),

        // Cancel a sale
        cancelSale: builder.mutation({
            query: (saleId) => ({
                url: `/sales/${saleId}/cancel`,
                method: 'PUT',
            }),
            invalidatesTags: (result, error, saleId) => [
                { type: 'Sale', id: saleId },
                { type: 'Sale', id: 'LIST' },
            ],
        }),

        // Fulfill a sale
        fulfillSale: builder.mutation({
            query: (saleId) => ({
                url: `/sales/${saleId}/fulfill`,
                method: 'PUT',
            }),
            invalidatesTags: (result, error, saleId) => [
                { type: 'Sale', id: saleId },
                { type: 'Sale', id: 'LIST' },
            ],
        }),

        // Get payment methods
        getPaymentMethods: builder.query({
            query: () => '/sales/payment-methods',
            providesTags: ['PaymentMethod'],
        }),
    }),
});

export const {
    useCreateSaleMutation,
    useGetSalesQuery,
    useGetSaleQuery,
    useAddPaymentMutation,
    useCancelSaleMutation,
    useFulfillSaleMutation,
    useGetPaymentMethodsQuery,
} = salesApi;
