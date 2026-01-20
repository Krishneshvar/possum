// categoriesApi.js

import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@/lib/api-client';

export const categoriesApi = createApi({
  reducerPath: 'categoriesApi',
  baseQuery,
  tagTypes: ['Category'],
  endpoints: (builder) => ({
    getCategories: builder.query({
      query: () => '/categories',
      providesTags: (result) =>
        result
          ? [
            ...result.map(({ id }) => ({ type: 'Category', id })),
            { type: 'Category', id: 'LIST' },
          ]
          : [{ type: 'Category', id: 'LIST' }],
    }),
    addCategory: builder.mutation({
      query: (body) => ({
        url: '/categories',
        method: 'POST',
        body,
      }),
      // Invalidate the 'LIST' tag to refetch all categories after a new one is added
      invalidatesTags: [{ type: 'Category', id: 'LIST' }],
    }),
    updateCategory: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/categories/${id}`,
        method: 'PUT',
        body,
      }),
      // Invalidate both the specific category and the list to ensure a fresh UI
      invalidatesTags: (result, error, { id }) => [
        { type: 'Category', id },
        { type: 'Category', id: 'LIST' },
      ],
    }),
    deleteCategory: builder.mutation({
      query: (id) => ({
        url: `/categories/${id}`,
        method: 'DELETE',
      }),
      // Invalidate the specific category and the list
      invalidatesTags: (result, error, id) => [
        { type: 'Category', id },
        { type: 'Category', id: 'LIST' },
      ],
    }),
  }),
});

// The export statement needs to be updated to include the new mutation hooks
export const {
  useGetCategoriesQuery,
  useAddCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi;
