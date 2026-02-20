import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../lib/api-client';

export interface UserRecord {
    id: number;
    name: string;
    username: string;
    is_active: number;
    created_at: string;
    updated_at?: string;
}

export interface GetUsersResponse {
    users: UserRecord[];
    totalCount: number;
    totalPages: number;
}

export interface GetUsersParams {
    currentPage?: number;
    itemsPerPage?: number;
    searchTerm?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface CreateUserPayload {
    name: string;
    username: string;
    password: string;
    is_active?: boolean;
}

export interface UpdateUserPayload {
    id: number;
    name?: string;
    username?: string;
    password?: string;
    is_active?: boolean;
}

export const usersApi = createApi({
    reducerPath: 'usersApi',
    baseQuery,
    tagTypes: ['User'],
    endpoints: (builder) => ({
        getUsers: builder.query<GetUsersResponse, GetUsersParams>({
            query: (params) => ({
                url: '/users',
                params: {
                    searchTerm: params.searchTerm,
                    currentPage: params.currentPage,
                    itemsPerPage: params.itemsPerPage,
                    sortBy: params.sortBy,
                    sortOrder: params.sortOrder,
                },
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.users.map(({ id }) => ({ type: 'User' as const, id })),
                        { type: 'User', id: 'LIST' },
                    ]
                    : [{ type: 'User', id: 'LIST' }],
        }),
        getUserById: builder.query<UserRecord, number>({
            query: (id) => `/users/${id}`,
            providesTags: (result, error, id) => [{ type: 'User', id }],
        }),
        createUser: builder.mutation<UserRecord, CreateUserPayload>({
            query: (body) => ({
                url: '/users',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'User', id: 'LIST' }],
        }),
        updateUser: builder.mutation<UserRecord, UpdateUserPayload>({
            query: ({ id, ...body }) => ({
                url: `/users/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'User', id },
                { type: 'User', id: 'LIST' },
            ],
        }),
        deleteUser: builder.mutation<void, number>({
            query: (id) => ({
                url: `/users/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'User', id },
                { type: 'User', id: 'LIST' },
            ],
        }),
    }),
});

export const {
    useGetUsersQuery,
    useGetUserByIdQuery,
    useCreateUserMutation,
    useUpdateUserMutation,
    useDeleteUserMutation,
} = usersApi;
