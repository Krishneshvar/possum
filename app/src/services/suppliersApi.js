import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@/lib/api-client';

export const suppliersApi = createApi({
    reducerPath: 'suppliersApi',
    baseQuery,
    tagTypes: ['Suppliers'],
    endpoints: (builder) => ({
        getSuppliers: builder.query({
            query: () => '/suppliers',
            providesTags: ['Suppliers'],
        }),
        createSupplier: builder.mutation({
            query: (newSupplier) => ({
                url: '/suppliers',
                method: 'POST',
                body: newSupplier,
            }),
            invalidatesTags: ['Suppliers'],
        }),
        updateSupplier: builder.mutation({
            query: ({ id, ...updatedSupplier }) => ({
                url: `/suppliers/${id}`,
                method: 'PUT',
                body: updatedSupplier,
            }),
            invalidatesTags: ['Suppliers'],
        }),
        deleteSupplier: builder.mutation({
            query: (id) => ({
                url: `/suppliers/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Suppliers'],
        }),
    }),
});

export const {
    useGetSuppliersQuery,
    useCreateSupplierMutation,
    useUpdateSupplierMutation,
    useDeleteSupplierMutation,
} = suppliersApi;
