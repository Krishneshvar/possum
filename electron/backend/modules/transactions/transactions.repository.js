/**
 * Transaction Repository
 * Handles all database operations for transactions
 */
import { getDB } from '../../shared/db/index.js';

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
}) {
    const db = getDB();
    const filterClauses = [];
    const filterParams = [];

    if (startDate) {
        filterClauses.push('date(t.transaction_date) >= date(?)');
        filterParams.push(startDate);
    }

    if (endDate) {
        filterClauses.push('date(t.transaction_date) <= date(?)');
        filterParams.push(endDate);
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
    `).get(...filterParams);

    const totalCount = countResult?.total_count ?? 0;

    // Validate sortBy
    const allowedSortFields = ['transaction_date', 'amount', 'status'];
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'transaction_date';
    const finalSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const offset = (currentPage - 1) * itemsPerPage;

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
        totalPages: Math.ceil(totalCount / itemsPerPage),
        currentPage
    };
}
