import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE } from '@/lib/api-client';

export const customersApi = createApi({
    reducerPath: 'customersApi',
    baseQuery: fetchBaseQuery({ baseUrl: API_BASE }),
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
    }),
});

export const {
    useGetCustomersQuery,
    useGetCustomerByIdQuery,
    useCreateCustomerMutation,
} = customersApi;
