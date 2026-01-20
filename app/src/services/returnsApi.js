import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@/lib/api-client';

export const returnsApi = createApi({
    reducerPath: 'returnsApi',
    baseQuery,
    tagTypes: ['Return'],
    endpoints: (builder) => ({
        // Create a return
        createReturn: builder.mutation({
            query: (body) => ({
                url: '/returns',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'Return', id: 'LIST' }],
        }),

        // Get returns list
        getReturns: builder.query({
            query: (params = {}) => {
                const query = new URLSearchParams();
                if (params.page) query.append('page', params.page);
                if (params.limit) query.append('limit', params.limit);
                if (params.saleId) query.append('saleId', params.saleId);
                if (params.startDate) query.append('startDate', params.startDate);
                if (params.endDate) query.append('endDate', params.endDate);
                return `/returns?${query.toString()}`;
            },
            providesTags: (result) =>
                result
                    ? [
                        ...result.returns.map(({ id }) => ({ type: 'Return', id })),
                        { type: 'Return', id: 'LIST' },
                    ]
                    : [{ type: 'Return', id: 'LIST' }],
        }),

        // Get return details
        getReturn: builder.query({
            query: (id) => `/returns/${id}`,
            providesTags: (result, error, id) => [{ type: 'Return', id }],
        }),

        // Get returns for a sale
        getSaleReturns: builder.query({
            query: (saleId) => `/sales/${saleId}/returns`,
            providesTags: (result, error, saleId) => [{ type: 'Return', id: `sale-${saleId}` }],
        }),
    }),
});

export const {
    useCreateReturnMutation,
    useGetReturnsQuery,
    useGetReturnQuery,
    useGetSaleReturnsQuery,
} = returnsApi;
