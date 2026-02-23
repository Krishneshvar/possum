/**
 * Transaction Query Types
 */

export interface GetTransactionsQuery {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    type?: 'payment' | 'refund';
    paymentMethodId?: number;
    status?: 'completed' | 'pending' | 'cancelled';
    searchTerm?: string;
    sortBy?: 'transaction_date' | 'amount' | 'status' | 'customer_name' | 'invoice_number';
    sortOrder?: 'ASC' | 'DESC';
}
