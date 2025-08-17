import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE } from '@/lib/api-client';

export const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE }),
  tagTypes: ['Products'],
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: () => '/products',
      providesTags: ['Products'],
    }),
    getProduct: builder.query({
      query: (id) => `/products/${id}`,
      providesTags: ['Products'],
    }),
    addProduct: builder.mutation({
      query: (body) => ({
        url: '/products',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Products'],
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/products/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Products'],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Products'],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useAddProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productsApi;
