import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@/lib/api-client';

export const taxesApi = createApi({
    reducerPath: 'taxesApi',
    baseQuery,
    tagTypes: ['Tax'],
    endpoints: (builder) => ({
        getTaxes: builder.query({
            query: () => '/taxes',
            providesTags: (result) =>
                result
                    ? [...result.map(({ id }) => ({ type: 'Tax', id })), { type: 'Tax', id: 'LIST' }]
                    : [{ type: 'Tax', id: 'LIST' }],
        }),
        addTax: builder.mutation({
            query: (body) => ({
                url: '/taxes',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'Tax', id: 'LIST' }],
        }),
    }),
});

export const {
    useGetTaxesQuery,
    useAddTaxMutation,
} = taxesApi;
