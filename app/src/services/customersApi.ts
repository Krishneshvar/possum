import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../lib/api-client';

export interface Customer {
    id: number;
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    loyalty_points?: number;
    is_tax_exempt?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface GetCustomersParams {
    page?: number;
    limit?: number;
    searchTerm?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface GetCustomersResponse {
    customers: Customer[];
    totalCount: number;
    totalPages: number;
    page: number;
    limit: number;
}

export interface CustomerWritePayload {
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
}

export const customersApi = createApi({
    reducerPath: 'customersApi',
    baseQuery,
    tagTypes: ['Customer'],
    endpoints: (builder) => ({
        getCustomers: builder.query<GetCustomersResponse, GetCustomersParams>({
            query: (params) => ({
                url: '/customers',
                params,
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.customers.map(({ id }) => ({ type: 'Customer' as const, id })),
                        { type: 'Customer', id: 'LIST' },
                    ]
                    : [{ type: 'Customer', id: 'LIST' }],
        }),
        getCustomerById: builder.query<Customer, number>({
            query: (id) => `/customers/${id}`,
            providesTags: (result, error, id) => [{ type: 'Customer', id }],
        }),
        createCustomer: builder.mutation<Customer, CustomerWritePayload>({
            query: (body) => ({
                url: '/customers',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'Customer', id: 'LIST' }],
        }),
        updateCustomer: builder.mutation<Customer, Partial<CustomerWritePayload> & { id: number }>({
            query: ({ id, ...body }) => ({
                url: `/customers/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Customer', id },
                { type: 'Customer', id: 'LIST' },
            ],
        }),
        deleteCustomer: builder.mutation<void, number>({
            query: (id) => ({
                url: `/customers/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'Customer', id },
                { type: 'Customer', id: 'LIST' },
            ],
        }),
    }),
});

export const {
    useGetCustomersQuery,
    useGetCustomerByIdQuery,
    useCreateCustomerMutation,
    useUpdateCustomerMutation,
    useDeleteCustomerMutation,
} = customersApi;
