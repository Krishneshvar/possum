import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const taxesApi = createApi({
    reducerPath: 'taxesApi',
    baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:3001/api/taxes' }),
    tagTypes: ['Tax'],
    endpoints: (builder) => ({
        getTaxes: builder.query({
            query: () => '/',
            providesTags: (result) =>
                result
                    ? [...result.map(({ id }) => ({ type: 'Tax', id })), { type: 'Tax', id: 'LIST' }]
                    : [{ type: 'Tax', id: 'LIST' }],
        }),
        addTax: builder.mutation({
            query: (body) => ({
                url: '/',
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
