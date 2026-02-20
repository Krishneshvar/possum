import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../lib/api-client';

export interface ReturnItem {
    id: number;
    return_id: number;
    sale_item_id: number;
    quantity: number;
    refund_amount: number;
    variant_id: number;
    price_per_unit: number;
    tax_rate: number | null;
    variant_name: string;
    sku: string | null;
    product_name: string;
}

export interface ReturnRecord {
    id: number;
    sale_id: number;
    user_id: number;
    reason: string | null;
    created_at: string;
    invoice_number: string;
    processed_by_name: string;
    total_refund: number;
    items: ReturnItem[];
}

export interface GetReturnsParams {
    page?: number;
    limit?: number;
    saleId?: number;
    userId?: number;
    startDate?: string;
    endDate?: string;
    searchTerm?: string;
}

export interface GetReturnsResponse {
    returns: ReturnRecord[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
}

export interface CreateReturnPayload {
    saleId: number;
    items: Array<{ saleItemId: number; quantity: number }>;
    reason: string;
}

export interface CreateReturnResponse {
    id: number;
    saleId: number;
    totalRefund: number;
    itemCount: number;
}

export const returnsApi = createApi({
    reducerPath: 'returnsApi',
    baseQuery,
    tagTypes: ['Return', 'Sale', 'Inventory'],
    endpoints: (builder) => ({
        // Create a new return
        createReturn: builder.mutation<CreateReturnResponse, CreateReturnPayload>({
            query: (newReturn) => ({
                url: '/returns',
                method: 'POST',
                body: newReturn,
            }),
            invalidatesTags: (_result, _error, { saleId }) => [
                'Return',
                { type: 'Sale', id: saleId },
                { type: 'Sale', id: 'LIST' },
                'Inventory'
            ],
        }),

        // Get returns list
        getReturns: builder.query<GetReturnsResponse, GetReturnsParams | void>({
            query: (params) => {
                if (!params) {
                    return { url: '/returns' };
                }
                return {
                    url: '/returns',
                    params
                };
            },
            providesTags: ['Return'],
        }),

        // Get return details
        getReturn: builder.query<ReturnRecord, number>({
            query: (id) => `/returns/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Return', id }],
        }),

        // Get returns for a sale
        getSaleReturns: builder.query<ReturnRecord[], number>({
            query: (saleId) => `/returns/sale/${saleId}`,
            providesTags: (_result, _error, saleId) => [{ type: 'Return', id: `SALE-${saleId}` }],
        }),
    }),
});

export const {
    useCreateReturnMutation,
    useGetReturnsQuery,
    useGetReturnQuery,
    useGetSaleReturnsQuery,
} = returnsApi;
