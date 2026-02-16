/**
 * Transaction Repository
 * Handles all database operations for transactions
 */
import { getDB } from '../../shared/db/index.js';

interface TransactionQueryParams {
    startDate?: string;
    endDate?: string;
    type?: string;
    paymentMethodId?: number;
    status?: string;
    currentPage?: number;
    itemsPerPage?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC' | string;
}

/**
 * Find transactions with filtering and pagination
 * @param {Object} params - Filter params
 * @returns {Object} Transactions list with pagination
 */
export function findTransactions({
    startDate,
    endDate,
    type,
    paymentMethodId,
    status,
    currentPage = 1,
    itemsPerPage = 20,
    sortBy = 'transaction_date',
    sortOrder = 'DESC'
}: TransactionQueryParams) {
    const db = getDB();
    const filterClauses: string[] = [];
    const filterParams: any[] = [];

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

    const whereClause = filterClauses.length > 0
        ? `WHERE ${filterClauses.join(' AND ')}`
        : '';

    const countResult = db.prepare(`
        SELECT COUNT(*) as total_count
        FROM transactions t
        ${whereClause}
    `).get(...filterParams) as { total_count: number };

    const totalCount = countResult?.total_count ?? 0;

    // Validate sortBy
    const allowedSortFields = ['transaction_date', 'amount', 'status'];
    const finalSortBy = allowedSortFields.includes(sortBy!) ? sortBy : 'transaction_date';
    const finalSortOrder = (sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const offset = (currentPage! - 1) * itemsPerPage!;

    const transactions = db.prepare(`
        SELECT 
            t.*,
            pm.name as payment_method_name,
            s.invoice_number,
            c.name as customer_name
        FROM transactions t
        JOIN payment_methods pm ON t.payment_method_id = pm.id
        JOIN sales s ON t.sale_id = s.id
        LEFT JOIN customers c ON s.customer_id = c.id
        ${whereClause}
        ORDER BY t.${finalSortBy} ${finalSortOrder}
        LIMIT ? OFFSET ?
    `).all(...filterParams, itemsPerPage, offset);

    return {
        transactions,
        totalCount,
        totalPages: Math.ceil(totalCount / itemsPerPage!),
        currentPage
    };
}
