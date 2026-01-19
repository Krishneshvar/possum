import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE } from '@/lib/api-client';

export const productFlowApi = createApi({
    reducerPath: 'productFlowApi',
    baseQuery: fetchBaseQuery({ baseUrl: API_BASE }),
    tagTypes: ['ProductFlow'],
    endpoints: (builder) => ({
        // Get flow timeline for a variant
        getVariantFlow: builder.query({
            query: ({ variantId, limit = 100, offset = 0, startDate, endDate }) => {
                const query = new URLSearchParams();
                query.append('limit', limit);
                query.append('offset', offset);
                if (startDate) query.append('startDate', startDate);
                if (endDate) query.append('endDate', endDate);
                return `/product-flow/variants/${variantId}?${query.toString()}`;
            },
            providesTags: (result, error, { variantId }) => [{ type: 'ProductFlow', id: variantId }],
        }),

        // Get flow summary for a variant
        getVariantFlowSummary: builder.query({
            query: (variantId) => `/product-flow/variants/${variantId}/summary`,
            providesTags: (result, error, variantId) => [{ type: 'ProductFlow', id: `summary-${variantId}` }],
        }),
    }),
});

export const {
    useGetVariantFlowQuery,
    useGetVariantFlowSummaryQuery,
} = productFlowApi;
