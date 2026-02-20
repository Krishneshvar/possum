import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE } from '../lib/api-client';

export const variantsApi = createApi({
  reducerPath: 'variantsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth?.token || localStorage.getItem('possum_token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Variant', 'VariantStats'],
  endpoints: (builder) => ({
    getVariants: builder.query({
      query: (params) => {
        const query = new URLSearchParams();
        for (const key in params) {
          if (Array.isArray(params[key])) {
            params[key].forEach((item: string) => query.append(key, item));
          } else if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
            query.append(key, params[key]);
          }
        }
        return `/variants?${query.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
            ...result.variants.map(({ id }: { id: number }) => ({ type: 'Variant' as const, id })),
            { type: 'Variant', id: 'LIST' },
          ]
          : [{ type: 'Variant', id: 'LIST' }],
    }),
    getVariantStats: builder.query({
      query: () => '/variants/stats',
      providesTags: ['VariantStats'],
    }),
  }),
});

export const {
  useGetVariantsQuery,
  useGetVariantStatsQuery,
} = variantsApi;
