import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE } from '@/lib/api-client';

const createProductFormData = (body) => {
  const formData = new FormData();
  
  const excludedKeys = ['imageFile', 'variants'];

  for (const key in body) {
    if (body.hasOwnProperty(key) && !excludedKeys.includes(key)) {
      formData.append(key, body[key]);
    }
  }

  const variantsData = body.variants.map(v => {
    const { product_tax, ...rest } = v;
    return rest;
  });
  formData.append('variants', JSON.stringify(variantsData));

  if (body.imageFile) {
    formData.append('image', body.imageFile);
  }

  return formData;
};

export const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE }),
  tagTypes: ['Products'],
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: (params) => {
        const query = new URLSearchParams();
        for (const key in params) {
          if (Array.isArray(params[key])) {
            params[key].forEach(item => query.append(key, item));
          } else if (params[key] !== null && params[key] !== '') {
            query.append(key, params[key]);
          }
        }
        return `/products?${query.toString()}`;
      },
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
        body: createProductFormData(body),
      }),
      invalidatesTags: ['Products'],
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/products/${id}`,
        method: 'PUT',
        body: createProductFormData(body),
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
