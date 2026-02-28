import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../lib/api-client';
import { type Supplier, type PaymentPolicy } from '@shared/index';

export type { Supplier, PaymentPolicy };

export interface GetSuppliersParams {
    page?: number;
    limit?: number;
    searchTerm?: string;
    paymentPolicyId?: number;
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
    tagTypes: ['Suppliers', 'PaymentPolicies'],
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
        getPaymentPolicies: builder.query<PaymentPolicy[], void>({
            query: () => '/suppliers/payment-policies',
            providesTags: ['PaymentPolicies'],
        }),
        createPaymentPolicy: builder.mutation<PaymentPolicy, { name: string, days_to_pay: number, description?: string }>({
            query: (newPolicy) => ({
                url: '/suppliers/payment-policies',
                method: 'POST',
                body: newPolicy,
            }),
            invalidatesTags: ['PaymentPolicies'],
        }),
    }),
});

export const {
    useGetSuppliersQuery,
    useCreateSupplierMutation,
    useUpdateSupplierMutation,
    useDeleteSupplierMutation,
    useGetPaymentPoliciesQuery,
    useCreatePaymentPolicyMutation,
} = suppliersApi;
