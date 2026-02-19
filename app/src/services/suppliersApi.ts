import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../lib/api-client';

export interface Supplier {
    id: number;
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
}

export interface GetSuppliersParams {
    page?: number;
    limit?: number;
    searchTerm?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface GetSuppliersResponse {
    suppliers: Supplier[];
    totalCount: number;
    totalPages: number;
    page: number;
    limit: number;
}

export const suppliersApi = createApi({
    reducerPath: 'suppliersApi',
    baseQuery,
    tagTypes: ['Suppliers'],
    endpoints: (builder) => ({
        getSuppliers: builder.query<GetSuppliersResponse, GetSuppliersParams>({
            query: (params) => ({
                url: '/suppliers',
                params: params,
            }),
            providesTags: ['Suppliers'],
        }),
        createSupplier: builder.mutation<Supplier, Partial<Supplier>>({
            query: (newSupplier) => ({
                url: '/suppliers',
                method: 'POST',
                body: newSupplier,
            }),
            invalidatesTags: ['Suppliers'],
        }),
        updateSupplier: builder.mutation<Supplier, Partial<Supplier> & { id: number }>({
            query: ({ id, ...updatedSupplier }) => ({
                url: `/suppliers/${id}`,
                method: 'PUT',
                body: updatedSupplier,
            }),
            invalidatesTags: ['Suppliers'],
        }),
        deleteSupplier: builder.mutation<void, number>({
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
