/**
 * Transaction Service
 * Handles business logic for transactions
 */
import * as transactionRepo from './transactions.repository.js';

/**
 * Get transactions with pagination and filters
 * @param {Object} params - Query parameters
 * @returns {Object} Transactions list
 */
export function getTransactions(params) {
    return transactionRepo.findTransactions({
        startDate: params.startDate,
        endDate: params.endDate,
        type: params.type,
        paymentMethodId: params.paymentMethodId,
        status: params.status,
        currentPage: parseInt(params.page) || 1,
        itemsPerPage: parseInt(params.limit) || 20,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder
    });
}
