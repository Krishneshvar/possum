import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@/lib/api-client';

export const customersApi = createApi({
    reducerPath: 'customersApi',
    baseQuery,
    tagTypes: ['Customer'],
    endpoints: (builder) => ({
        getCustomers: builder.query({
            query: (params) => ({
                url: '/customers',
                params,
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.customers.map(({ id }) => ({ type: 'Customer', id })),
                        { type: 'Customer', id: 'LIST' },
                    ]
                    : [{ type: 'Customer', id: 'LIST' }],
        }),
        getCustomerById: builder.query({
            query: (id) => `/customers/${id}`,
            providesTags: (result, error, id) => [{ type: 'Customer', id }],
        }),
        createCustomer: builder.mutation({
            query: (body) => ({
                url: '/customers',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'Customer', id: 'LIST' }],
        }),
        updateCustomer: builder.mutation({
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
        deleteCustomer: builder.mutation({
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
