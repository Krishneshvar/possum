/**
 * Transaction Repository
 * Handles all database operations for transactions
 */
import { getDB } from '../../electron/backend/shared/db/index.js';
import type { ITransactionRepository, TransactionRecord, TransactionQueryParams, PaginatedTransactions } from '../../core/index.js';

export class TransactionRepository implements ITransactionRepository {
/**
 * Find transactions with filtering and pagination
 * @param {Object} params - Filter params
 * @returns {Object} Transactions list with pagination
 */
findTransactions({
    startDate,
    endDate,
    type,
    paymentMethodId,
    status,
    searchTerm,
    currentPage = 1,
    itemsPerPage = 20,
    sortBy = 'transaction_date',
    sortOrder = 'DESC'
}: TransactionQueryParams): PaginatedTransactions {
    const db = getDB();
    const filterClauses: string[] = [];
    const filterParams: (string | number)[] = [];

    if (startDate) {
        // Optimize: Use direct string comparison to utilize index
        const dateOnly = startDate.substring(0, 10);
        filterClauses.push('t.transaction_date >= ?');
        filterParams.push(`${dateOnly} 00:00:00`);
    }

    if (endDate) {
        // Optimize: Use direct string comparison to utilize index
        const dateOnly = endDate.substring(0, 10);
        filterClauses.push('t.transaction_date <= ?');
        filterParams.push(`${dateOnly} 23:59:59`);
    }

    if (type) {
        filterClauses.push('t.type = ?');
        filterParams.push(type);
    }

    if (paymentMethodId) {
        filterClauses.push('t.payment_method_id = ?');
        filterParams.push(paymentMethodId);
    }

    if (status) {
        filterClauses.push('t.status = ?');
        filterParams.push(status);
    }

    if (searchTerm) {
        filterClauses.push('(s.invoice_number LIKE ? OR COALESCE(c.name, \'\') LIKE ?)');
        const fuzzyTerm = `%${searchTerm}%`;
        filterParams.push(fuzzyTerm, fuzzyTerm);
    }

    const whereClause = filterClauses.length > 0
        ? `WHERE ${filterClauses.join(' AND ')}`
        : '';

    const countResult = db.prepare(`
        SELECT COUNT(*) as total_count
        FROM transactions t
        LEFT JOIN sales s ON t.sale_id = s.id
        LEFT JOIN customers c ON s.customer_id = c.id
        ${whereClause}
    `).get(...filterParams) as { total_count: number };

    const totalCount = countResult?.total_count ?? 0;

    // Validate sortBy
    const allowedSortFields = ['transaction_date', 'amount', 'status', 'customer_name', 'invoice_number'] as const;
    const sortFieldMap: Record<(typeof allowedSortFields)[number], string> = {
        transaction_date: 't.transaction_date',
        amount: 't.amount',
        status: 't.status',
        customer_name: 'c.name',
        invoice_number: 's.invoice_number'
    };
    const finalSortBy = allowedSortFields.includes(sortBy!) ? sortBy : 'transaction_date';
    const finalSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';
    const orderByColumn = sortFieldMap[finalSortBy];

    const offset = (currentPage! - 1) * itemsPerPage!;

    const transactions = db.prepare(`
        SELECT 
            t.*,
            pm.name as payment_method_name,
            s.invoice_number,
            c.name as customer_name
        FROM transactions t
        LEFT JOIN payment_methods pm ON t.payment_method_id = pm.id
        LEFT JOIN sales s ON t.sale_id = s.id
        LEFT JOIN customers c ON s.customer_id = c.id
        ${whereClause}
        ORDER BY ${orderByColumn} ${finalSortOrder}
        LIMIT ? OFFSET ?
    `).all(...filterParams, itemsPerPage, offset) as TransactionRecord[];

    return {
        transactions,
        totalCount,
        totalPages: Math.ceil(totalCount / itemsPerPage!),
        currentPage
    };
}
}
