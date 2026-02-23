export interface ReturnFilters {
    saleId?: number;
    userId?: number;
    startDate?: string;
    endDate?: string;
    searchTerm?: string;
    currentPage?: number;
    itemsPerPage?: number;
}

export interface IReturnRepository {
    insertReturn(data: { sale_id: number; user_id: number; reason?: string }): any;
    insertReturnItem(data: { return_id: number; sale_item_id: number; quantity: number; refund_amount: number }): any;
    findReturnById(id: number): any;
    findReturnsBySaleId(saleId: number): any[];
    findReturns(params: ReturnFilters): any;
    getTotalReturnedQuantity(saleItemId: number): number;
}
