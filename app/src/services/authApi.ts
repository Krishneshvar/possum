import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../lib/api-client';

export const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery,
    endpoints: (builder) => ({
        login: builder.mutation({
            query: (credentials) => ({
                url: '/auth/login',
                method: 'POST',
                body: credentials,
            }),
        }),
        getMe: builder.query({
            query: () => '/auth/me',
        }),
    }),
});

export const { useLoginMutation, useGetMeQuery } = authApi;
