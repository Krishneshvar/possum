import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@/lib/api-client';

export const salesApi = createApi({
    reducerPath: 'salesApi',
    baseQuery,
    tagTypes: ['Sale', 'PaymentMethod'],
    endpoints: (builder) => ({
        // Create a new sale
        createSale: builder.mutation({
            query: (body) => ({
                url: '/sales',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'Sale', id: 'LIST' }],
        }),

        // Get sales list with pagination
        getSales: builder.query({
            query: (params = {}) => {
                const query = new URLSearchParams();
                if (params.page) query.append('page', params.page);
                if (params.limit) query.append('limit', params.limit);
                if (params.status) {
                    const statuses = Array.isArray(params.status) ? params.status : [params.status];
                    statuses.forEach(s => query.append('status', s));
                }
                if (params.customerId) query.append('customerId', params.customerId);
                if (params.startDate) query.append('startDate', params.startDate);
                if (params.endDate) query.append('endDate', params.endDate);
                if (params.searchTerm) query.append('searchTerm', params.searchTerm);
                if (params.fulfillmentStatus) {
                    const statuses = Array.isArray(params.fulfillmentStatus) ? params.fulfillmentStatus : [params.fulfillmentStatus];
                    statuses.forEach(s => query.append('fulfillmentStatus', s));
                }
                if (params.sortBy) query.append('sortBy', params.sortBy);
                if (params.sortOrder) query.append('sortOrder', params.sortOrder);
                return `/sales?${query.toString()}`;
            },
            providesTags: (result) =>
                result
                    ? [
                        ...result.sales.map(({ id }) => ({ type: 'Sale', id })),
                        { type: 'Sale', id: 'LIST' },
                    ]
                    : [{ type: 'Sale', id: 'LIST' }],
        }),

        // Get sale details
        getSale: builder.query({
            query: (id) => `/sales/${id}`,
            providesTags: (result, error, id) => [{ type: 'Sale', id }],
        }),

        // Add payment to a sale
        addPayment: builder.mutation({
            query: ({ saleId, ...body }) => ({
                url: `/sales/${saleId}/payments`,
                method: 'POST',
                body,
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
