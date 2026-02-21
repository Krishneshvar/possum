import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../lib/api-client';
import { type Supplier } from '@shared/index';

export type { Supplier };

export interface GetSuppliersParams {
    page?: number;
    limit?: number;
    searchTerm?: string;
    sortBy?: 'name' | 'contact_person' | 'phone' | 'email' | 'created_at';
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
        deleteSupplier: builder.mutation<{ message: string }, number>({
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
