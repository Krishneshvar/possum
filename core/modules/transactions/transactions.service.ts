/**
 * Transaction Service
 * Handles business logic for transactions
 */
import { ITransactionRepository, PaginatedTransactions } from './transactions.repository.interface.js';
import { GetTransactionsQuery } from '../../../dtos/index.js';

let transactionRepo: ITransactionRepository;

export function initTransactionService(repo: ITransactionRepository) {
    transactionRepo = repo;
}

export type GetTransactionsParams = GetTransactionsQuery;
export interface GetTransactionsContext {
    permissions?: string[];
}

/**
 * Get transactions with pagination and filters
 * @param {Object} params - Query parameters
 * @returns {Object} Transactions list
 */
export function getTransactions(params: GetTransactionsParams, context: GetTransactionsContext = {}): PaginatedTransactions {
    const userPermissions = context.permissions || [];
    const canView = userPermissions.includes('reports.view')
        || userPermissions.includes('sales.view')
        || userPermissions.includes('sales.create');

    if (!canView) {
        throw new Error('Forbidden: Missing required permission to view transactions');
    }

    const currentPage = Math.max(1, params.page ?? 1);
    const itemsPerPage = Math.min(100, Math.max(1, params.limit ?? 20));

    return transactionRepo.findTransactions({
        startDate: params.startDate,
        endDate: params.endDate,
        type: params.type,
        paymentMethodId: params.paymentMethodId,
        status: params.status,
        searchTerm: params.searchTerm,
        currentPage,
        itemsPerPage,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder
    });
}
