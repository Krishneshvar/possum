import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../lib/api-client';
import { PurchaseOrder } from '@shared/index';

interface PurchaseOrdersQueryParams {
    page?: number;
    limit?: number;
    searchTerm?: string;
    status?: 'pending' | 'received' | 'cancelled';
    fromDate?: string;
    toDate?: string;
    sortBy?: 'id' | 'supplier_name' | 'order_date' | 'status' | 'item_count' | 'total_cost';
    sortOrder?: 'ASC' | 'DESC';
}

interface PurchaseOrdersResponse {
    purchaseOrders: PurchaseOrder[];
    totalCount: number;
    totalPages: number;
    page: number;
    limit: number;
}

interface CreatePurchaseOrderPayload {
    supplier_id: number;
    items: Array<{
        variant_id: number;
        quantity: number;
        unit_cost: number;
    }>;
}

export const purchaseApi = createApi({
    reducerPath: 'purchaseApi',
    baseQuery,
    tagTypes: ['PurchaseOrders', 'Products', 'Inventory'],
    endpoints: (builder) => ({
        getPurchaseOrders: builder.query<PurchaseOrdersResponse, PurchaseOrdersQueryParams | void>({
            query: (params) => ({
                url: '/purchase',
                params: params ?? {},
            }),
            providesTags: ['PurchaseOrders'],
        }),
        getPurchaseOrderById: builder.query<PurchaseOrder, number>({
            query: (id) => `/purchase/${id}`,
            providesTags: (result, error, id) => {
                void result;
                void error;
                return [{ type: 'PurchaseOrders', id }];
            },
        }),
        createPurchaseOrder: builder.mutation<PurchaseOrder, CreatePurchaseOrderPayload>({
            query: (newPo) => ({
                url: '/purchase',
                method: 'POST',
                body: newPo,
            }),
            invalidatesTags: ['PurchaseOrders'],
        }),
        receivePurchaseOrder: builder.mutation<PurchaseOrder, number>({
            query: (id) => ({
                url: `/purchase/${id}/receive`,
                method: 'POST',
            }),
            invalidatesTags: ['PurchaseOrders', 'Inventory', 'Products'],
        }),
        cancelPurchaseOrder: builder.mutation<PurchaseOrder, number>({
            query: (id) => ({
                url: `/purchase/${id}/cancel`,
                method: 'POST',
            }),
            invalidatesTags: ['PurchaseOrders'],
        }),
    }),
});

export const {
    useGetPurchaseOrdersQuery,
    useGetPurchaseOrderByIdQuery,
    useCreatePurchaseOrderMutation,
    useReceivePurchaseOrderMutation,
    useCancelPurchaseOrderMutation,
} = purchaseApi;
