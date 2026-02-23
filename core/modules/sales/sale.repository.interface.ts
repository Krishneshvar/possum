export interface SaleFilter {
    status?: string[];
    customerId?: number;
    userId?: number;
    startDate?: string;
    endDate?: string;
    searchTerm?: string;
    currentPage?: number;
    itemsPerPage?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    fulfillmentStatus?: string | string[];
}

export interface PaginatedSales {
    sales: any[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
}

export interface ISaleRepository {
    insertSale(saleData: any): any;
    insertSaleItem(itemData: any): any;
    findSaleById(id: number): any;
    findSales(params: SaleFilter): PaginatedSales;
    updateSaleStatus(id: number, status: string): any;
    updateFulfillmentStatus(id: number, status: string): any;
    updateSalePaidAmount(id: number, paidAmount: number): any;
    insertTransaction(transactionData: any): any;
    getLastSale(): any;
    findPaymentMethods(): any[];
    paymentMethodExists(id: number): boolean;
    findSaleItems(saleId: number): any[];
    saleExists(id: number): boolean;
}
