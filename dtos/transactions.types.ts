/**
 * Transaction Query Types
 */

export interface GetTransactionsQuery {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    type?: 'payment' | 'refund' | 'purchase' | 'purchase_refund';
    paymentMethodId?: number;
    status?: 'completed' | 'pending' | 'cancelled';
    searchTerm?: string;
    sortBy?: 'transaction_date' | 'amount' | 'status' | 'customer_name' | 'invoice_number' | 'supplier_name';
    sortOrder?: 'ASC' | 'DESC';
}
