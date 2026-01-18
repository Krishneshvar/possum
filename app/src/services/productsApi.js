import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE } from '@/lib/api-client';

const createFormData = (body, isUpdate = false) => {
  const formData = new FormData();
  for (const key in body) {
    if (body[key] !== undefined && body[key] !== null) {
      if (key === 'imageFile') {
        formData.append('image', body[key]);
      } else if (key === 'variants') {
        if (!isUpdate) {
          formData.append('variants', JSON.stringify(body[key]));
        }
      } else {
        formData.append(key, body[key]);
      }
    }
  }
  return formData;
};

export const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE,
    prepareHeaders: (headers, { getState, endpoint }) => {
      if (['addProduct', 'updateProduct'].includes(endpoint)) {
        headers.delete('Content-Type');
      }
      return headers;
    },
  }),
  tagTypes: ['Product', 'Variant'],
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
      providesTags: (result) =>
        result
          ? [
            ...result.products.map(({ id }) => ({ type: 'Product', id })),
            { type: 'Product', id: 'LIST' },
          ]
          : [{ type: 'Product', id: 'LIST' }],
    }),
    getProduct: builder.query({
      query: (id) => `/products/${id}`,
      providesTags: (result, error, id) => [
        { type: 'Product', id },
        ...(result?.variants?.map(v => ({ type: 'Variant', id: v.id })) || []),
      ],
    }),
    addProduct: builder.mutation({
      query: (body) => ({
        url: '/products',
        method: 'POST',
        body: createFormData(body),
      }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/products/${id}`,
        method: 'PUT',
        body: createFormData(body, true),
        headers: {},
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Product', id },
        { type: 'Product', id: 'LIST' },
      ],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Product', id },
        { type: 'Product', id: 'LIST' },
      ],
    }),
    addVariant: builder.mutation({
      query: (body) => ({
        url: `/products/variants`,
        method: 'POST',
        body,
      }),
      async onQueryStarted({ productId, ...body }, { dispatch, queryFulfilled }) {
        try {
          const { data: newVariant } = await queryFulfilled;
          dispatch(
            productsApi.util.updateQueryData('getProduct', productId, (draft) => {
              draft.variants.push({ ...body, id: newVariant.id });
            })
          );
        } catch {
          // If the request fails, the cache will not be updated.
        }
      },
      invalidatesTags: (result, error, { productId }) => [{ type: 'Product', id: productId }],
    }),
    updateVariant: builder.mutation({
      query: ({ id, ...variantData }) => ({
        url: `/products/variants/${id}`,
        method: 'PUT',
        body: variantData,
      }),
      async onQueryStarted({ productId, id, ...body }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          productsApi.util.updateQueryData('getProduct', productId, (draft) => {
            const variantIndex = draft.variants.findIndex(v => v.id === id);
            if (variantIndex !== -1) {
              Object.assign(draft.variants[variantIndex], body);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (result, error, { productId }) => [{ type: 'Product', id: productId }],
    }),
    deleteVariant: builder.mutation({
      query: ({ id }) => ({
        url: `/products/variants/${id}`,
        method: 'DELETE',
      }),
      async onQueryStarted({ id, productId }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          productsApi.util.updateQueryData('getProduct', productId, (draft) => {
            draft.variants = draft.variants.filter(v => v.id !== id);
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (result, error, { id, productId }) => [
        { type: 'Variant', id },
        { type: 'Product', id: productId },
        { type: 'Product', id: 'LIST' },
      ],
    }),
    getVariants: builder.query({
      query: (params) => {
        const query = new URLSearchParams();
        for (const key in params) {
          if (params[key] !== null && params[key] !== '') {
            query.append(key, params[key]);
          }
        }
        return `/products/variants/search?${query.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
            ...result.map(({ id }) => ({ type: 'Variant', id })),
            { type: 'Variant', id: 'LIST' },
          ]
          : [{ type: 'Variant', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useAddProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useAddVariantMutation,
  useUpdateVariantMutation,
  useDeleteVariantMutation,
  useGetVariantsQuery,
} = productsApi;
