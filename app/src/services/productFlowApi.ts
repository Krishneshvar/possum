import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@/lib/api-client';

export interface ProductFlowParams {
    variantId: number;
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
    paymentMethods?: string[];
}

export const productFlowApi = createApi({
    reducerPath: 'productFlowApi',
    baseQuery,
    tagTypes: ['ProductFlow'],
    endpoints: (builder) => ({
        // Get flow timeline for a variant
        getVariantFlow: builder.query({
            query: ({ variantId, limit = 100, offset = 0, startDate, endDate, paymentMethods }: ProductFlowParams) => {
                const query = new URLSearchParams();
                query.append('limit', limit.toString());
                query.append('offset', offset.toString());
                if (startDate) query.append('startDate', startDate);
                if (endDate) query.append('endDate', endDate);
                if (paymentMethods && paymentMethods.length > 0) {
                    query.append('paymentMethods', paymentMethods.join(','));
                }
                return `/product-flow/variants/${variantId}?${query.toString()}`;
            },
            providesTags: (result, error, { variantId }) => [{ type: 'ProductFlow', id: variantId }],
        }),

        // Get flow summary for a variant
        getVariantFlowSummary: builder.query({
            query: (variantId: number) => `/product-flow/variants/${variantId}/summary`,
            providesTags: (result, error, variantId) => [{ type: 'ProductFlow', id: `summary-${variantId}` }],
        }),
    }),
});

export const {
    useGetVariantFlowQuery,
    useGetVariantFlowSummaryQuery,
} = productFlowApi;
