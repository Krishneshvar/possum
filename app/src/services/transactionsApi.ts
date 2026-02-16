import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../lib/api-client';

export const transactionsApi = createApi({
    reducerPath: 'transactionsApi',
    baseQuery,
    tagTypes: ['Transaction'],
    endpoints: (builder) => ({
        // Get transactions list with pagination
        getTransactions: builder.query({
            query: (params: any = {}) => {
                const query = new URLSearchParams();
                if (params.page) query.append('page', params.page);
                if (params.limit) query.append('limit', params.limit);
                if (params.status) query.append('status', params.status);
                if (params.type) query.append('type', params.type);
                if (params.paymentMethodId) query.append('paymentMethodId', params.paymentMethodId);
                if (params.startDate) query.append('startDate', params.startDate);
                if (params.endDate) query.append('endDate', params.endDate);
                if (params.sortBy) query.append('sortBy', params.sortBy);
                if (params.sortOrder) query.append('sortOrder', params.sortOrder);
                return `/transactions?${query.toString()}`;
            },
            providesTags: (result) =>
                result
                    ? [
                        ...result.transactions.map(({ id }: { id: number }) => ({ type: 'Transaction' as const, id })),
                        { type: 'Transaction', id: 'LIST' },
                    ]
                    : [{ type: 'Transaction', id: 'LIST' }],
        }),
    }),
});

export const {
    useGetTransactionsQuery,
} = transactionsApi;
