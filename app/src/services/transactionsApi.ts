import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../lib/api-client';
import { Transaction } from '../../../types/index';

export interface TransactionsQueryParams {
    page?: number;
    limit?: number;
    status?: 'completed' | 'pending' | 'cancelled';
    type?: 'payment' | 'refund' | 'purchase' | 'purchase_refund';
    paymentMethodId?: number;
    startDate?: string;
    endDate?: string;
    searchTerm?: string;
    sortBy?: 'transaction_date' | 'amount' | 'status' | 'customer_name' | 'invoice_number' | 'supplier_name';
    sortOrder?: 'ASC' | 'DESC';
}

export interface TransactionsResponse {
    transactions: Array<Transaction & { invoice_number: string | null; customer_name: string | null; supplier_name: string | null }>;
    totalCount: number;
    totalPages: number;
    currentPage: number;
}

export const transactionsApi = createApi({
    reducerPath: 'transactionsApi',
    baseQuery,
    tagTypes: ['Transaction'],
    endpoints: (builder) => ({
        // Get transactions list with pagination
        getTransactions: builder.query<TransactionsResponse, TransactionsQueryParams | undefined>({
            query: (params = {}) => {
                const query = new URLSearchParams();
                if (params.page) query.append('page', String(params.page));
                if (params.limit) query.append('limit', String(params.limit));
                if (params.status) query.append('status', params.status);
                if (params.type) query.append('type', params.type);
                if (params.paymentMethodId) query.append('paymentMethodId', String(params.paymentMethodId));
                if (params.startDate) query.append('startDate', params.startDate);
                if (params.endDate) query.append('endDate', params.endDate);
                if (params.searchTerm) query.append('searchTerm', params.searchTerm);
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
