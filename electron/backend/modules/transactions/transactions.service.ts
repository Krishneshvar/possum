/**
 * Transaction Service
 * Handles business logic for transactions
 */
import * as transactionRepo from './transactions.repository.js';

interface GetTransactionsParams {
    startDate?: string;
    endDate?: string;
    type?: string;
    paymentMethodId?: number;
    status?: string;
    page?: number | string;
    limit?: number | string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC' | string;
}

/**
 * Get transactions with pagination and filters
 * @param {Object} params - Query parameters
 * @returns {Object} Transactions list
 */
export function getTransactions(params: GetTransactionsParams) {
    return transactionRepo.findTransactions({
        startDate: params.startDate,
        endDate: params.endDate,
        type: params.type,
        paymentMethodId: params.paymentMethodId,
        status: params.status,
        currentPage: typeof params.page === 'string' ? parseInt(params.page) : (params.page || 1),
        itemsPerPage: typeof params.limit === 'string' ? parseInt(params.limit) : (params.limit || 20),
        sortBy: params.sortBy,
        sortOrder: params.sortOrder as 'ASC' | 'DESC' | undefined
    });
}
