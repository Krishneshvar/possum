import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../lib/api-client';

export const taxesApi = createApi({
    reducerPath: 'taxesApi',
    baseQuery: baseQuery,
    tagTypes: ['TaxProfile', 'TaxCategory', 'TaxRule'],
    endpoints: (builder) => ({
        // Profiles
        getTaxProfiles: builder.query({
            query: () => '/taxes/profiles',
            providesTags: ['TaxProfile'],
        }),
        createTaxProfile: builder.mutation({
            query: (body) => ({
                url: '/taxes/profiles',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['TaxProfile'],
        }),
        updateTaxProfile: builder.mutation({
            query: ({ id, ...body }) => ({
                url: `/taxes/profiles/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['TaxProfile'],
        }),
        deleteTaxProfile: builder.mutation({
            query: (id) => ({
                url: `/taxes/profiles/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['TaxProfile'],
        }),

        // Categories
        getTaxCategories: builder.query({
            query: () => '/taxes/categories',
            providesTags: ['TaxCategory'],
        }),
        createTaxCategory: builder.mutation({
            query: (body) => ({
                url: '/taxes/categories',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['TaxCategory'],
        }),
        updateTaxCategory: builder.mutation({
            query: ({ id, ...body }) => ({
                url: `/taxes/categories/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['TaxCategory'],
        }),
        deleteTaxCategory: builder.mutation({
            query: (id) => ({
                url: `/taxes/categories/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['TaxCategory'],
        }),

        // Rules
        getTaxRules: builder.query({
            query: (profileId) => `/taxes/rules?profileId=${profileId}`,
            providesTags: ['TaxRule'],
        }),
        createTaxRule: builder.mutation({
            query: (body) => ({
                url: '/taxes/rules',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['TaxRule'],
        }),
        updateTaxRule: builder.mutation({
            query: ({ id, ...body }) => ({
                url: `/taxes/rules/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['TaxRule'],
        }),
        deleteTaxRule: builder.mutation({
            query: (id) => ({
                url: `/taxes/rules/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['TaxRule'],
        }),

        // Calculation
        calculateTax: builder.mutation({
            query: (body) => ({
                url: '/taxes/calculate',
                method: 'POST',
                body,
            }),
        }),
    }),
});

export const {
    useGetTaxProfilesQuery,
    useCreateTaxProfileMutation,
    useUpdateTaxProfileMutation,
    useDeleteTaxProfileMutation,
    useGetTaxCategoriesQuery,
    useCreateTaxCategoryMutation,
    useUpdateTaxCategoryMutation,
    useDeleteTaxCategoryMutation,
    useGetTaxRulesQuery,
    useCreateTaxRuleMutation,
    useUpdateTaxRuleMutation,
    useDeleteTaxRuleMutation,
    useCalculateTaxMutation,
} = taxesApi;
