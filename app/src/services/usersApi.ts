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

export interface Role {
    id: number;
    name: string;
    description?: string;
}

export interface Permission {
    id: number;
    key: string;
    description?: string;
}

export interface UserPermissionOverride {
    permission_id: number;
    key: string;
    granted: number;
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
        getRoles: builder.query<Role[], void>({
            query: () => '/users/roles',
        }),
        getPermissions: builder.query<Permission[], void>({
            query: () => '/users/permissions',
        }),
        getUserRoles: builder.query<Role[], number>({
            query: (userId) => `/users/${userId}/roles`,
            providesTags: (result, error, userId) => [{ type: 'User', id: userId }],
        }),
        updateUserRoles: builder.mutation<void, { userId: number; roleIds: number[] }>({
            query: ({ userId, roleIds }) => ({
                url: `/users/${userId}/roles`,
                method: 'PUT',
                body: { roleIds },
            }),
            invalidatesTags: (result, error, { userId }) => [
                { type: 'User', id: userId },
                { type: 'User', id: 'LIST' },
            ],
        }),
        getUserPermissions: builder.query<UserPermissionOverride[], number>({
            query: (userId) => `/users/${userId}/permissions`,
            providesTags: (result, error, userId) => [{ type: 'User', id: userId }],
        }),
        updateUserPermissions: builder.mutation<void, { userId: number; permissions: Array<{ permissionId: number; granted: boolean }> }>({
            query: ({ userId, permissions }) => ({
                url: `/users/${userId}/permissions`,
                method: 'PUT',
                body: { permissions },
            }),
            invalidatesTags: (result, error, { userId }) => [
                { type: 'User', id: userId },
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
    useGetRolesQuery,
    useGetPermissionsQuery,
    useGetUserRolesQuery,
    useUpdateUserRolesMutation,
    useGetUserPermissionsQuery,
    useUpdateUserPermissionsMutation,
} = usersApi;
