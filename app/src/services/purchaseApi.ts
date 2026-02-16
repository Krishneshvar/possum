import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../lib/api-client';

export const purchaseApi = createApi({
    reducerPath: 'purchaseApi',
    baseQuery,
    tagTypes: ['PurchaseOrders', 'Products', 'Inventory'],
    endpoints: (builder) => ({
        getPurchaseOrders: builder.query({
            query: (params) => ({
                url: '/purchase',
                params: params,
            }),
            providesTags: ['PurchaseOrders'],
        }),
        getPurchaseOrderById: builder.query({
            query: (id) => `/purchase/${id}`,
            providesTags: (result, error, id) => [{ type: 'PurchaseOrders', id }],
        }),
        createPurchaseOrder: builder.mutation({
            query: (newPo) => ({
                url: '/purchase',
                method: 'POST',
                body: newPo,
            }),
            invalidatesTags: ['PurchaseOrders'],
        }),
        receivePurchaseOrder: builder.mutation({
            query: (id) => ({
                url: `/purchase/${id}/receive`,
                method: 'POST',
            }),
            invalidatesTags: ['PurchaseOrders', 'Inventory', 'Products'],
        }),
        cancelPurchaseOrder: builder.mutation({
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
