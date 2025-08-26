import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE } from '@/lib/api-client';

export const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE }),
  tagTypes: ['Products'],
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: (params) => {
        const query = new URLSearchParams();

        for (const key in params) {
          if (params.hasOwnProperty(key)) {
            const value = params[key];

            if (Array.isArray(value)) {
              value.forEach(item => query.append(key, item));
            } else if (value !== null && value !== '') {
              query.append(key, value);
            }
          }
        }

        const queryParams = query.toString();
        return `/products?${queryParams}`;
      },
      providesTags: ['Products'],
    }),
    getProduct: builder.query({
      query: (id) => `/products/${id}`,
      providesTags: ['Products'],
    }),
    addProduct: builder.mutation({
      query: (body) => {
        const formData = new FormData();

        const variantsData = body.variants.map(v => {
          const { product_tax, ...rest } = v;
          return rest;
        });

        for (const key in body) {
          if (key !== 'imageFile' && key !== 'variants' && key !== 'product_tax') {
            formData.append(key, body[key]);
          }
        }

        if (body.product_tax !== undefined) {
          formData.append('product_tax', body.product_tax);
        }

        formData.append('variants', JSON.stringify(variantsData));

        if (body.imageFile) {
          formData.append('image', body.imageFile);
        }

        return {
          url: '/products',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['Products'],
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...body }) => {
        const formData = new FormData();

        const variantsData = body.variants.map(v => {
          const { product_tax, ...rest } = v;
          return rest;
        });

        for (const key in body) {
          if (key !== 'imageFile' && key !== 'variants' && key !== 'product_tax') {
            formData.append(key, body[key]);
          }
        }

        if (body.product_tax !== undefined) {
          formData.append('product_tax', body.product_tax);
        }

        formData.append('variants', JSON.stringify(variantsData));

        if (body.imageFile) {
          formData.append('image', body.imageFile);
        }

        return {
          url: `/products/${id}`,
          method: 'PUT',
          body: formData,
        };
      },
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
