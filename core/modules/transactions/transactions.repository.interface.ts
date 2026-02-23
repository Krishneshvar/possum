export interface TransactionRecord {
    id: number;
    sale_id: number;
    amount: number;
    type: 'payment' | 'refund';
    payment_method_id: number;
    status: 'completed' | 'pending' | 'cancelled';
    transaction_date: string;
    payment_method_name: string | null;
    invoice_number: string | null;
    customer_name: string | null;
}

export interface TransactionQueryParams {
    startDate?: string;
    endDate?: string;
    type?: 'payment' | 'refund';
    paymentMethodId?: number;
    status?: 'completed' | 'pending' | 'cancelled';
    searchTerm?: string;
    currentPage?: number;
    itemsPerPage?: number;
    sortBy?: 'transaction_date' | 'amount' | 'status' | 'customer_name' | 'invoice_number';
    sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedTransactions {
    transactions: TransactionRecord[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
}

export interface ITransactionRepository {
    findTransactions(params: TransactionQueryParams): PaginatedTransactions;
}
